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
                text: "This is the email or phone number of someone we can contact at your venue. We'll never reach out to your venue without contacting you first.",
              },
              label: {
                type: "plain_text",
                text: "Venue point of contact",
              },
            },
          ]
        : []),
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Next, we need proof of venue. You can use one of the following:",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: ":white_check_mark: Scan of a contract",
          },
          {
            type: "mrkdwn",
            text: ":white_check_mark: <https://www.investopedia.com/terms/m/mou.asp|MOU>",
          },
          {
            type: "mrkdwn",
            text: ":white_check_mark: Written confirmation from your venue in a screenshot or PDF of an email",
          },
        ],
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
            url: `https://${process.env.DOMAIN}/apply?${new URLSearchParams({
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
