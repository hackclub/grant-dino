export default function uploadView({
  state,
  externalId,
  venueProofUploaded = false,
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
                ? ":white_check_mark: Venue proof uploaded!"
                : ":tw_outbox_tray: Upload proof of venue",
            },
            url: venueProofUploaded
              ? undefined
              : `https://grantbot.ngrok.io/apply?${new URLSearchParams({
                  s: state,
                })}}`,
            style: venueProofUploaded ? undefined : "primary",
          },
        ],
      },
    ],
  };
}
