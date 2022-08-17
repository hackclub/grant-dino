import "dotenv/config";

import * as fs from "fs";

import _bolt from "@slack/bolt";
const { App } = _bolt;

import { v4 as uuid } from "uuid";
import formidable from "formidable";
import airtable from "airtable";

import venueView from "./views/venue.js";
import t from "./transcript.js";
import applyView from "./views/apply.js";
import { sign, verify } from "./jwt.js";
import axios from "axios";

function extractUrl(url) {
  // stolen from https://urlregex.com
  const match = url?.match(
    /(([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?/
  );

  if (!match) return null;

  return match[0];
}

function isBankUrl(url) {
  return /bank\.hackclub\.com\/[a-zA-Z0-9\-_]+/i.test(url);
}

const base = airtable.base("appEzv7w2IBMoxxHe");

const app = new App({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  customRoutes: [
    {
      method: "GET",
      path: "/apply",
      async handler(req, res) {
        const url = new URL(req.url, "https://example.com");

        const state = await verify(url.searchParams.get("s"));

        res.setHeader("Content-Type", "text/html");
        res.end(
          `<!DOCTYPE html>
<html>
  <body>
    <form method="POST" enctype="multipart/form-data">
      <input type="file" name="venue-proof" required />
      <input type="submit" />
    </form>
    <!-- <pre><code>${JSON.stringify(state)}</code></pre> -->
  </body>
</html>`
        );
      },
    },
    {
      method: "POST",
      path: "/apply",
      async handler(req, res) {
        const url = new URL(req.url, "https://example.com");

        const state = await verify(url.searchParams.get("s"));

        const form = formidable();

        form.parse(req, async (err, fields, files) => {
          if (err) {
            return res.end("something went wrong.");
          }

          const file = files["venue-proof"];
          const stream = fs.createReadStream(file.filepath);

          const { data: url } = await axios.post(
            "https://bucky.hackclub.com",
            { file: stream },
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          state.venue_proof_url = url;
          state.venue_proof_filename = file.originalFilename;

          await app.client.views.update({
            external_id: state.external_id,
            view: venueView({
              state: await sign(state),
              venueProofUploaded: true,
              venueProofUrl:
                file.mimetype == "image/png" || file.mimetype == "image/jpeg"
                  ? state.venue_proof_url
                  : undefined,
              venueProofFilename: state.venue_proof_filename,
              externalId: state.external_id,
            }),
          });

          res.end("yay!");
        });
      },
    },
  ],
});

app.message(async ({ message, client }) => {
  if (message.channel != process.env.GRANTS_CHANNEL) return;
  if (message.subtype) return;

  if (!message.thread_ts) {
    // Top-level message!

    const url = extractUrl(message.text);

    if (url) {
      await client.chat.postMessage({
        channel: message.channel,
        text: `<@${message.user}> over here!`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "is this a hackathon I spot? click the button to start your application!",
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: ":point_right: APPLY :point_left:",
                },
                style: "primary",
                action_id: "apply",
                value: await sign({
                  original_ts: message.ts,
                  url,
                  user: message.user,
                }),
              },
            ],
          },
        ],
        thread_ts: message.ts,
      });
      await client.reactions.add({
        name: t.react.greet,
        channel: message.channel,
        timestamp: message.ts,
      });
    } else {
      await client.reactions.add({
        name: t.react.invalid,
        channel: message.channel,
        timestamp: message.ts,
      });
      await client.chat.postEphemeral({
        channel: message.channel,
        user: message.user,
        text: "Hmm, I don't see a URL in that message— try posting your hackathon's website URL here!",
      });
    }
  }
});

app.action("apply", async ({ client, body, ack, action }) => {
  await ack();

  const state = await verify(action.value);

  if (body.user.id != state.user) {
    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: body.user.id,
      thread_ts: body.container.thread_ts,
      text: "you didn't start this application!",
    });
    return;
  }

  state.ts = body.message.ts;

  await client.views.open({
    trigger_id: body.trigger_id,
    view: applyView({
      url: state.url,
      state: await sign(state),
    }),
  });
});

app.view("apply", async ({ ack, view }) => {
  const state = await verify(view.private_metadata);

  const externalId = uuid();
  state.external_id = externalId;

  const bank_url = view.state.values.bank_url.bank_url.value;

  if (!isBankUrl(bank_url)) {
    await ack({
      response_action: "errors",
      errors: {
        bank_url:
          "Hmm, this doesn't look like a Hack Club Bank organization URL.",
      },
    });
    return;
  }

  state.bank_url = bank_url;
  state.url = view.state.values.url.url.value;

  await ack({
    response_action: "push",
    view: venueView({
      state: await sign(state),
      externalId,
    }),
  });
});

app.view("apply2", async ({ ack, view, client }) => {
  const state = await verify(view.private_metadata);

  state.venue_email = view.state.values.venue_email.venue_email.value;

  console.log(state);

  await base("FIRST Grant").create([
    {
      fields: {
        "Event URL": state.url,
        "Slack User": state.user,
        "Message URL": `https://hackclub.slack.com/archives/${
          process.env.GRANTS_CHANNEL
        }/p${state.original_ts.replace(".", "")}`,
        "Bank URL": state.bank_url,
        "Proof of Venue": [
          {
            url: state.venue_proof_url,
            filename: state.venue_proof_filename,
          },
        ],
        "Venue Email Address": state.venue_email,
        Status: "Pending",
      },
    },
  ]);

  const text =
    "Your application has been submitted! We'll review it and post in this thread within 24 hours.";

  await client.chat.update({
    channel: process.env.GRANTS_CHANNEL,
    ts: state.ts,
    text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text,
        },
      },
    ],
  });

  await client.reactions.add({
    name: t.react.reviewing,
    channel: process.env.GRANTS_CHANNEL,
    timestamp: state.original_ts,
  });
  await client.reactions.remove({
    name: t.react.greet,
    channel: process.env.GRANTS_CHANNEL,
    timestamp: state.original_ts,
  });

  await ack({ response_action: "clear" });
});

// idk
app.action("idk", async ({ ack }) => await ack());

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("💰 grantbot is now dealing out grants!");
})();
