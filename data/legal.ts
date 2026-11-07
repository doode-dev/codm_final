// DRAFT policy text that matches how the site works today. Have a lawyer review and adapt it before you launch.
export const legal: Record<string, { title: string; sections: [string, string][] }> = {
  terms: {
    title: "Terms of service",
    sections: [
      ["Who we are", "CODM Accounts is a marketplace where people list and buy Call of Duty: Mobile accounts. We are not affiliated with Activision or Tencent."],
      ["Your account", "You must give true information, keep your password private, and be old enough to form a contract where you live. You are responsible for what happens under your account. We can suspend or ban accounts that break these terms."],
      ["Game publisher rules", "Activision's terms prohibit buying, selling and transferring game accounts. Accounts sold here can be banned, restricted or recovered by the original owner. We cannot prevent that and do not promise permanent access. See the risk disclosure."],
      ["Buying and selling", "Sellers list accounts and describe them honestly. Buyers pay through us. We hold the payment until the buyer confirms the account or a dispute is settled. We charge sellers a commission on completed sales and buyers a service fee, both shown before you commit."],
      ["Prohibited conduct", "No fake or copied listings, no stolen accounts, no taking payment outside the site, no sharing passwords or codes in listings, no abuse of other users or our staff."],
      ["Our liability", "To the extent the law allows, we are not liable for losses caused by publisher actions against an account, or for indirect losses. Nothing here limits rights you cannot lose by law."],
      ["Changes", "We may update these terms. Continuing to use the site after a change means you accept it."],
    ],
  },
  privacy: {
    title: "Privacy policy",
    sections: [
      ["What we collect", "Your email, username, country and password (stored only as a secure hash). Sellers also give a phone number, which we verify by text message, and an optional bio. We keep your orders, messages, saved accounts, cart, support requests and technical logs."],
      ["How we use it", "To run your account, process orders and payouts, prevent fraud, handle disputes and support requests, and improve the site."],
      ["Who sees it", "Your username and seller name are public. Your phone number is seen only by our team. Buyers and sellers can read the chat on their own order. We use service providers to host the site and database and to send email. We do not sell your data."],
      ["Your choices", "You can change your username, country and password in your profile. To see, correct or delete your data, contact support. We may keep records we are required to keep, such as order and payment records."],
      ["Security", "Access to data is limited by role, and admin actions are logged. No system is perfectly secure, so use a strong, unique password."],
    ],
  },
  cookies: {
    title: "Cookie policy",
    sections: [
      ["What we use", "We use only the cookies needed to keep you signed in and to protect your session. We do not use advertising cookies."],
      ["Your choices", "You can block cookies in your browser, but you will not be able to sign in."],
    ],
  },
  refunds: {
    title: "Refund and dispute policy",
    sections: [
      ["How payment is held", "When you place an order, the account is reserved for you. You pay us, not the seller. We release the money to the seller after you confirm the account, or after we settle a dispute."],
      ["Review window", "After payment you have 3 days to check the account. If it is not as listed, open a dispute from your order page before the window ends. Describe what is wrong and keep the conversation in the order chat."],
      ["How we decide", "Our team reads the listing, the order chat and the evidence, then either refunds you or releases the money to the seller. Refunds are not guaranteed. Losing access because the publisher acts against an account is a known risk of this market and is not by itself a reason for a refund."],
      ["Unpaid orders", "An order that is not paid within the reservation time is cancelled and the account goes back on sale."],
      ["Contact", "If something goes wrong outside the review window, contact support and we will look at it case by case."],
    ],
  },
  "seller-policy": {
    title: "Seller policy",
    sections: [
      ["Before you list", "Create a seller profile with a seller name and a private phone number, and verify the number by text message before you list. You must own every account you list."],
      ["Listings", "Be accurate about level, ranks, items and any bans or restrictions. Upload your own, clear screenshots. Never include passwords, codes or recovery details in a listing or screenshot. Every new or edited listing is reviewed before it goes live."],
      ["Fees and payouts", "We take a 10% commission on completed sales. You are paid after the buyer confirms and our checks pass. Payouts are released only to verified sellers and can be held during a dispute."],
      ["Delivery", "After payment, share the access steps with the buyer in the order chat only. Do not take the sale elsewhere."],
      ["Breaking the rules", "We can reject, suspend or remove listings, hold payouts, or ban sellers who mislead buyers or break these rules."],
    ],
  },
  "buyer-policy": {
    title: "Buyer policy",
    sections: [
      ["Before you buy", "Read the whole listing, including the disclosed risks and any enforcement history. Ask questions in the order chat after you pay."],
      ["Paying", "Pay only as shown on your payment page and quote your order number. Never pay a seller directly. Staff will never ask you to pay anyone else."],
      ["After delivery", "Check the account carefully before you confirm. Confirming releases the money to the seller. If it is not as listed, open a dispute before the review window ends."],
      ["Security", "After you get an account, change the linked email and sign-in details and turn on any extra security the game offers."],
    ],
  },
  "risk-disclosure": {
    title: "Risk disclosure",
    sections: [
      ["Buying and selling accounts breaks the game's rules", "Activision's terms say game accounts may not be bought, sold or transferred. This marketplace is not endorsed by Activision."],
      ["What can happen", "An account can be banned, restricted or reset by the publisher. The original owner may recover the account or ask the publisher to restore it. You can lose the account and the money you paid for it."],
      ["What we do and don't do", "We review listings, hold payments and settle disputes. We cannot promise that any account is safe, ban-free or permanent, and we cannot stop the publisher or a former owner from acting."],
      ["Your decision", "Only buy or sell if you understand and accept these risks."],
    ],
  },
};
