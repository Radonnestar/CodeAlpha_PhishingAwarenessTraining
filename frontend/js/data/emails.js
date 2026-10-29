export const phishingEmails = [
  {
    id: "account-suspension",
    category: "credential phishing",
    parts: [
      {
        id: "sender",
        region: "header",
        label: "From",
        text: "Examplebank Support <support@examplebank-secure.co>",
        flag: {
          title: "Lookalike sender domain",
          explanation: "The domain examplebank-secure.co is not the bank's own domain. It only borrows the brand name.",
        },
      },
      {
        id: "recipient",
        region: "header",
        label: "To",
        text: "Undisclosed recipients",
        flag: {
          title: "Not addressed to you",
          explanation: "A genuine account message is sent to your own address. Hidden recipient lists point to a mass mailing.",
        },
      },
      {
        id: "subject",
        region: "header",
        label: "Subject",
        text: "URGENT: Your account will be suspended in 24 hours",
        flag: {
          title: "Artificial urgency",
          explanation: "A tight deadline is designed to rush you into acting before you verify anything.",
        },
      },
      {
        id: "greeting",
        region: "body",
        text: "Dear valued customer,",
        flag: {
          title: "Generic greeting",
          explanation: "Your bank knows your name. An impersonal greeting suggests a template sent to thousands of people.",
        },
      },
      {
        id: "intro",
        region: "body",
        text: "We take the security of your money seriously.",
      },
      {
        id: "threat",
        region: "body",
        text: "Unusual activity was detected on your account. Confirm your identity now or your access will be permanently suspended.",
        flag: {
          title: "Threat of consequences",
          explanation: "Fear of losing access pressures you to comply instead of thinking.",
        },
      },
      {
        id: "link",
        region: "action",
        text: "Verify my account",
        caption: "Opens: https://examplebank-secure.co/verify",
        flag: {
          title: "Suspicious link and login request",
          explanation: "The destination is the same lookalike domain, and the email asks you to sign in through a link. Open the bank's site yourself instead.",
        },
      },
      {
        id: "attachment",
        region: "attachment",
        text: "Account_Statement.zip",
        caption: "Compressed archive, 2.4 MB",
        flag: {
          title: "Unexpected attachment",
          explanation: "Archives you did not ask for are a common way to deliver malware.",
        },
      },
      {
        id: "signature",
        region: "footer",
        text: "Examplebank Security Team",
      },
      {
        id: "copyright",
        region: "footer",
        text: "© Examplebank. All rights reserved.",
      },
    ],
  },
  {
    id: "executive-gift-cards",
    category: "business email compromise",
    parts: [
      {
        id: "sender",
        region: "header",
        label: "From",
        text: "Daniel Moore <daniel.moore.work@freemail.example>",
        flag: {
          title: "Executive writing from a personal address",
          explanation: "Your CEO writes from the company domain. A free webmail address claiming to be an executive is a classic impersonation sign.",
        },
      },
      {
        id: "recipient",
        region: "header",
        label: "To",
        text: "alex@yourcompany.com",
      },
      {
        id: "subject",
        region: "header",
        label: "Subject",
        text: "Quick favour",
      },
      {
        id: "greeting",
        region: "body",
        text: "Hi Alex,",
      },
      {
        id: "unavailable",
        region: "body",
        text: "Are you at your desk? I am heading into a board meeting and cannot take calls.",
        flag: {
          title: "Blocks verification",
          explanation: "Saying you cannot be called removes the easiest way to check that the request is real.",
        },
      },
      {
        id: "request",
        region: "body",
        text: "I need you to buy five $100 gift cards for a client gift today and send me the codes by reply.",
        flag: {
          title: "Unusual payment request",
          explanation: "Gift card codes work like untraceable cash. Real executives do not ask for them over email.",
        },
      },
      {
        id: "secrecy",
        region: "body",
        text: "Please keep this between us until I am out of the meeting.",
        flag: {
          title: "Request for secrecy",
          explanation: "Isolating you from colleagues stops anyone else from spotting the scam.",
        },
      },
      {
        id: "reimbursement",
        region: "body",
        text: "I will reimburse you this afternoon.",
      },
      {
        id: "signature",
        region: "footer",
        text: "Daniel",
      },
      {
        id: "device",
        region: "footer",
        text: "Sent from my mobile",
      },
    ],
  },
  {
    id: "shared-document",
    category: "fake document share",
    parts: [
      {
        id: "sender",
        region: "header",
        label: "From",
        text: "CloudDocs <no-reply@clouddocs-share.net>",
        flag: {
          title: "Lookalike service domain",
          explanation: "The real service sends from its own domain. This one adds extra words to look official.",
        },
      },
      {
        id: "recipient",
        region: "header",
        label: "To",
        text: "alex@yourcompany.com",
      },
      {
        id: "subject",
        region: "header",
        label: "Subject",
        text: "Marta Evans shared \"Q3 Salary Review\" with you",
        flag: {
          title: "Curiosity bait",
          explanation: "A document about salaries is designed to be too tempting to ignore. Attackers choose topics people cannot resist.",
        },
      },
      {
        id: "notice",
        region: "body",
        text: "Marta Evans has shared a document with you.",
      },
      {
        id: "signin",
        region: "body",
        text: "To view the file, sign in with your work email and password.",
        flag: {
          title: "Sign-in through an email link",
          explanation: "You should never type your password into a page you reached from a message. Go to the service yourself.",
        },
      },
      {
        id: "link",
        region: "action",
        text: "Open document",
        caption: "Opens: https://clouddocs-share.net/login?file=q3-salary",
        flag: {
          title: "Suspicious link",
          explanation: "The address leads to the lookalike domain and a login page, not to a document.",
        },
      },
      {
        id: "reason",
        region: "footer",
        text: "You received this email because a document was shared with you.",
      },
      {
        id: "copyright",
        region: "footer",
        text: "© CloudDocs Inc.",
      },
    ],
  },
  {
    id: "parcel-delivery",
    category: "parcel delivery scam",
    parts: [
      {
        id: "sender",
        region: "header",
        label: "From",
        text: "SwiftParcel Delivery <tracking@swiftparcel-delivery.help>",
        flag: {
          title: "Odd sender domain",
          explanation: "The .help ending and the hyphenated name do not match how a real courier addresses its customers.",
        },
      },
      {
        id: "recipient",
        region: "header",
        label: "To",
        text: "alex@yourcompany.com",
      },
      {
        id: "subject",
        region: "header",
        label: "Subject",
        text: "Delivery failed: action required",
      },
      {
        id: "failure",
        region: "body",
        text: "We could not deliver your parcel today.",
        flag: {
          title: "Delivery you did not expect",
          explanation: "These emails go to everyone, hoping some people have a real parcel on the way. Check your actual orders instead.",
        },
      },
      {
        id: "tracking",
        region: "body",
        text: "Tracking number: SP48213907",
      },
      {
        id: "fee",
        region: "body",
        text: "Pay a $1.99 redelivery fee within 12 hours or the parcel will be returned.",
        flag: {
          title: "Small fee plus a deadline",
          explanation: "A tiny amount lowers your guard and the deadline stops you from checking. The real goal is your card details.",
        },
      },
      {
        id: "link",
        region: "action",
        text: "Pay redelivery fee",
        caption: "Opens: http://swiftparcel-delivery.help/pay",
        flag: {
          title: "Insecure payment link",
          explanation: "It is a payment page reached from a message, on the same suspicious domain and without HTTPS. Never enter card details there.",
        },
      },
      {
        id: "support",
        region: "footer",
        text: "SwiftParcel Delivery, customer service",
      },
      {
        id: "automated",
        region: "footer",
        text: "Do not reply to this automated message.",
      },
    ],
  },
  {
    id: "password-expiry",
    category: "IT impersonation",
    parts: [
      {
        id: "sender",
        region: "header",
        label: "From",
        text: "IT Helpdesk <helpdesk@yourcompany.com>",
      },
      {
        id: "reply-to",
        region: "header",
        label: "Reply-To",
        text: "it.helpdesk.team@outlook-mail.co",
        flag: {
          title: "Replies go somewhere else",
          explanation: "The From address looks internal, but replies are redirected to an outside address. Always check Reply-To when an email asks you to answer.",
        },
      },
      {
        id: "recipient",
        region: "header",
        label: "To",
        text: "All staff",
      },
      {
        id: "subject",
        region: "header",
        label: "Subject",
        text: "Your password expires today",
        flag: {
          title: "Deadline pressure",
          explanation: "A same-day deadline pushes you to respond before you think or ask anyone.",
        },
      },
      {
        id: "greeting",
        region: "body",
        text: "Hello Alex,",
      },
      {
        id: "notice",
        region: "body",
        text: "Your network password expires at 5 pm today.",
      },
      {
        id: "ask",
        region: "body",
        text: "Reply to this email with your current password and your preferred new one so we can update it for you.",
        flag: {
          title: "Asks for your password",
          explanation: "IT staff never need your password. Anyone who asks for it is not IT.",
        },
      },
      {
        id: "lockout",
        region: "body",
        text: "Accounts that are not updated will be locked and may lose unsaved data.",
        flag: {
          title: "Threat of lockout",
          explanation: "Fear of losing work is used to make you comply without verifying.",
        },
      },
      {
        id: "signature",
        region: "footer",
        text: "IT Helpdesk",
      },
      {
        id: "internal",
        region: "footer",
        text: "This message is intended for internal staff only.",
      },
    ],
  },
];