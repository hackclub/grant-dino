export default function applyView({ url, state }) {
  return {
    type: "modal",
    callback_id: "apply",
    private_metadata: state,
    title: {
      type: "plain_text",
      text: "Your hackathon - 1/3",
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
          text: "Welcome, we're super excited to see your application!\n\n *As a reminder, here are the grant requirements:*",
        },
      },
      {
        type: "section",
        fields: [
          "Run by high schoolers",
          "Fully in-person",
          "Venue acquired",
          "Handmade website",
          "Free for attendees",
        ].map((requirement) => ({
          type: "mrkdwn",
          text: `:white_check_mark: ${requirement}`,
        })),
      },
      {
        type: "divider",
      },
      {
        type: "input",
        block_id: "url",
        element: {
          type: "plain_text_input",
          initial_value: url,
          action_id: "url",
          placeholder: {
            type: "plain_text",
            text: "e.g. https://mahacks.com",
          },
        },
        label: {
          type: "plain_text",
          text: "Hackathon Website",
        },
      },
      {
        type: "input",
        block_id: "start_date",
        element: {
          type: "datepicker",
          action_id: "start_date",
          focus_on_load: true,
        },
        label: {
          type: "plain_text",
          text: "Hackathon Date",
        },
        hint: {
          type: "plain_text",
          text: "If your hackathon spans multiple dates, select the start date.",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "You'll need to be on <https://hackclub.com/bank|Hack Club Bank> to receive your grant. If you're not, click that button to sign up! :arrow_right:",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: ":bank-hackclub: Sign up for Hack Club Bank",
          },
          action_id: "idk",
          url: "https://hackclub.com/bank#apply",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "We process Hack Club Bank signups within 24 hours on weekdays.",
          },
        ],
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
          text: "Hack Club Bank organization URL",
        },
      },
    ],
  };
}
