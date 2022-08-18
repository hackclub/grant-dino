import "dotenv/config";

import * as fs from "fs";

import _bolt from "@slack/bolt";
const { App } = _bolt;

import { v4 as uuid } from "uuid";
import formidable from "formidable";
import airtable from "airtable";
import axios from "axios";

import venueView from "./views/venue.js";
import t from "./transcript.js";
import applyView from "./views/apply.js";
import { sign, verify } from "./jwt.js";
import {
  extractUrl,
  escapeRegex,
  isBankUrl,
  safetyNet,
  coolSite,
} from "./util.js";

const ADMINS = [
  "U013B6CPV62", // Caleb
  "U01D6FYHLUW", // Ella
  "U0C7B14Q3", // Max
  "U01QHUY5XLK", // Mel
  "U02A67DA1QX", // Liv
];

const base = airtable.base("appEzv7w2IBMoxxHe");

const app = new App({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  customRoutes: [
    {
      method: "GET",
      path: "/apply",
      handler: safetyNet(async (req, res) => {
        const url = new URL(req.url, "https://example.com");

        await verify(url.searchParams.get("s"));

        res.setHeader("Content-Type", "text/html");
        res.end(await fs.promises.readFile("./src/views/upload.html"));
      }),
    },
    {
      method: "POST",
      path: "/apply",
      handler: safetyNet(async (req, res) => {
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

          try {
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
            res.end(
              coolSite(
                "&#x2705; Your proof of venue has been uploaded! Head back to Slack to continue your application."
              )
            );
          } catch (e) {
            res.end(
              coolSite(
                "&#x26D4; Something went wrong... did you close the popup in Slack?\n\nTry applying again, and post in the #hackathon-grants channel if you still have trouble."
              )
            );
          }
        });
      }),
    },
  ],
});

async function sendApplyButton({ channel, user, ts, url }) {
  await app.client.reactions.add({
    name: t.react.greet,
    channel,
    timestamp: ts,
  });
  await app.client.chat.postMessage({
    channel: channel,
    text: `<@${user}> over here!`,
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
              original_ts: ts,
              url,
              user,
            }),
          },
        ],
      },
    ],
    thread_ts: ts,
  });
}

app.message(async ({ message, client }) => {
  if (message.channel != process.env.GRANTS_CHANNEL) return;
  if (message.subtype) return;
  if (message.thread_ts) return;

  const url = extractUrl(message.text);

  if (!url) {
    await client.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
      text: "Hey there! I didn't see a URL in your message. If you're applying for a grant, make sure to post your hackathon's website URL here— otherwise, have a nice day!",
    });
  } else if (
    message.text.trim() == url ||
    new RegExp(`^<${escapeRegex(url)}(|\\S+)?>$`).test(message.text.trim())
  ) {
    await sendApplyButton({
      channel: message.channel,
      user: message.user,
      ts: message.ts,
      url,
    });
  } else {
    await client.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
      text: "I see you put a URL in that message— would you like to apply for a grant?",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `I see you put a URL in that message (${url})— would you like to apply for a grant?`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Yes!",
              },
              style: "primary",
              action_id: "yes-apply",
              value: await sign({
                original_ts: message.ts,
                url,
                user: message.user,
              }),
            },
          ],
        },
      ],
    });
  }
});

app.action("yes-apply", async ({ client, body, action, ack }) => {
  await ack();

  const state = await verify(action.value);

  await sendApplyButton({
    channel: body.channel.id,
    user: state.user,
    ts: state.original_ts,
    url: state.url,
  });
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
  state.start_date = view.state.values.start_date.start_date.selected_date;

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
        "Message Timestamp": state.original_ts,
        "Bank URL": state.bank_url,
        "Proof of Venue": [
          {
            url: state.venue_proof_url,
            filename: state.venue_proof_filename,
          },
        ],
        "Venue Contact Info": state.venue_email,
        "Start Date": state.start_date,
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

  await ack({
    response_action: "push",
    view: {
      type: "modal",
      clear_on_close: true,
      title: {
        type: "plain_text",
        text: "Thanks for applying!",
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":tada: Your application has been submitted! We'll review it and follow up within 24 hours.",
          },
        },
      ],
    },
  });
});

// idk
app.action("idk", async ({ ack }) => {
  await ack();
});

app.shortcut("update_grant_status", async ({ ack, shortcut, client }) => {
  await ack();

  if (!ADMINS.includes(shortcut.user.id)) return;

  await base("FIRST Grant")
    .select({
      maxRecords: 1,
      filterByFormula: `{Message Timestamp} = "${shortcut.message_ts}"`,
    })
    .firstPage(async (err, records) => {
      if (records.length == 0) return;
      const record = records[0];

      await client.views.open({
        trigger_id: shortcut.trigger_id,
        view: {
          type: "modal",
          title: {
            type: "plain_text",
            text: "Update grant status",
          },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: record.fields["Event URL"],
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Approve",
                  },
                  style: "primary",
                  action_id: "approve",
                  value: shortcut.message_ts,
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Reject",
                  },
                  style: "danger",
                  action_id: "reject",
                  value: shortcut.message_ts,
                },
              ],
            },
          ],
        },
      });
    });
});

async function updateReaction(ts, reaction) {
  try {
    await app.client.reactions.remove({
      name: t.react.reviewing,
      timestamp: ts,
      channel: process.env.GRANTS_CHANNEL,
    });
  } catch (e) {}
  try {
    await app.client.reactions.remove({
      name: t.react.rejected,
      timestamp: ts,
      channel: process.env.GRANTS_CHANNEL,
    });
  } catch (e) {}
  try {
    await app.client.reactions.remove({
      name: t.react.approved,
      timestamp: ts,
      channel: process.env.GRANTS_CHANNEL,
    });
  } catch (e) {}

  await app.client.reactions.add({
    name: t.react[reaction],
    timestamp: ts,
    channel: process.env.GRANTS_CHANNEL,
  });
}

app.action("approve", async ({ ack, action }) => {
  await ack();

  await updateReaction(action.value, "approved");
});

app.action("reject", async ({ ack, action }) => {
  await ack();

  await updateReaction(action.value, "rejected");
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("💰 grantbot is now dealing out grants!");
})();
