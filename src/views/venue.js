export default function venueView({
  state,
  externalId,
  venueProofUploaded = false,
  venueProofFilename,
  venueProofUrl,
}) {
  return {
    type: "modal",
    callback_id: "apply2",
    title: { type: "plain_text", text: "Your venue - 2/2" },
    close: { type: "plain_text", text: "Back" },
    submit: venueProofUploaded
      ? {
          type: "plain_text",
          text: ":flap: Apply :flap:",
          emoji: true,
        }
      : undefined,
    external_id: externalId,
    private_metadata: state,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Almost there! We just need some info on your venue.",
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: "idk",
            text: {
              type: "plain_text",
              emoji: true,
              text: venueProofUploaded
                ? `:white_check_mark: Upload new venue proof`
                : ":tw_outbox_tray: Upload proof of venue",
            },
            url: `https://grantbot.ngrok.io/apply?${new URLSearchParams({
              s: state,
            })}}`,
            style: venueProofUploaded ? undefined : "primary",
          },
        ],
      },
      ...(venueProofFilename
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `\`${venueProofFilename}\``,
              },
            },
          ]
        : []),
      ...(venueProofUrl
        ? [
            {
              type: "image",
              image_url: venueProofUrl,
              alt_text: "Proof of venue",
            },
          ]
        : []),
      ...(venueProofUploaded
        ? [
            {
              type: "input",
              block_id: "venue_email",
              element: {
                type: "plain_text_input",
                action_id: "venue_email",
                placeholder: {
                  type: "plain_text",
                  text: "e.g. orpheus@my-venue.com",
                },
              },
              hint: {
                type: "plain_text",
                text: "Can be a phone number or an email address.",
              },
              label: {
                type: "plain_text",
                text: "Venue contact info",
              },
            },
          ]
        : []),
    ],
  };
}
