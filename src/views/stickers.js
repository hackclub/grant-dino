export default function stickersView({ state }) {
  return {
    type: "modal",
    callback_id: "apply3",
    title: { type: "plain_text", text: "Want stickers? - 3/3" },
    close: { type: "plain_text", text: "Back" },
    submit: {
      type: "plain_text",
      text: ":flap: Apply :flap:",
      emoji: true,
    },
    private_metadata: state,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":bank-green-dark: :bank-engineering: :bank-hackclub: :bank-hackclub-dark: *Want <https://hackclub.com/stickers|stickers> to hand out at your event?*\n\nFill out your address and we'll ship you some when your grant application is approved!",
        },
        accessory: {
          type: "image",
          image_url:
            "https://cloud-kqntyd8jb-hack-club-bot.vercel.app/0stickers.png",
          alt_text: "Some Hack Club stickers",
        },
      },
      {
        type: "input",
        block_id: "address",
        optional: true,
        label: {
          type: "plain_text",
          text: "Address",
        },
        element: {
          type: "plain_text_input",
          action_id: "address",
          multiline: true,
          placeholder: {
            type: "plain_text",
            text: "6 Orpheus Way\nShelburne, VT\n05482",
          },
        },
      },
      {
        type: "input",
        block_id: "amount",
        optional: true,
        label: {
          type: "plain_text",
          text: "How many stickers do you want?",
        },
        element: {
          type: "radio_buttons",
          action_id: "amount",
          options: [
            {
              text: {
                type: "plain_text",
                text: "150",
              },
              value: "150",
            },
            {
              text: {
                type: "plain_text",
                text: "250",
              },
              value: "250",
            },
          ],
        },
      },
    ],
  };
}
