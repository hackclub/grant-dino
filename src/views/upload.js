export default function uploadView({
  state,
  externalId,
  venueProofUploaded = false,
  venueProofFilename,
  venueProofUrl,
}) {
  return {
    type: "modal",
    callback_id: "apply2",
    title: { type: "plain_text", text: "apply" },
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
          text: "Almost there! We just need a few more pieces of info.",
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
    ],
  };
}
