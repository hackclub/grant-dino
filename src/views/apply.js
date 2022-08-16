export default function applyView({ url, state }) {
  return {
    type: "modal",
    callback_id: "apply",
    private_metadata: state,
    title: {
      type: "plain_text",
      text: "apply",
    },
    submit: {
      type: "plain_text",
      text: "Next",
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `welcome, oh yeah, etc.`,
        },
      },
      {
        type: "input",
        block_id: "url",
        element: {
          type: "plain_text_input",
          initial_value: url,
          action_id: "url",
        },
        label: {
          type: "plain_text",
          text: "Event Website",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "You'll need to be on <https://hackclub.com/bank|Hack Club Bank> to receive your grant.",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: ":bank-hackclub: Apply for Hack Club Bank",
          },
          action_id: "idk",
          url: "https://hackclub.com/bank#apply",
        },
      },
      {
        type: "input",
        block_id: "bank_url",
        element: {
          type: "plain_text_input",
          action_id: "bank_url",
          placeholder: {
            type: "plain_text",
            text: "e.g. bank.hackclub.com/mahacks",
          },
        },
        label: {
          type: "plain_text",
          text: "Hack Club Bank URL",
        },
      },
    ],
  };
}
