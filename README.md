# Trade Hub Dashboard

Create a mobile-first trading app dashboard with a sleek, dark-themed UI inspired by professional mobile trading platforms. 



Here are the exact requirements:



1. Layout & Navigation:

- A top header displaying "Accounts" as the main title, with profile and notification icons.

- A card displaying account summary: "GOLD HOLDINGS #223840870", with tags for "Real", "MT5", and "Pro".

- A large balance display showing a dynamic balance value, and quick action buttons right below: "Trade", "Deposit", "Withdraw", and "Transfer".

- A sub-navigation tab bar for positions: "Open (173)", "Pending", and "Closed".

- A bottom navigation bar with tabs: "Accounts", "Trade", "Insights", "Performance", and "Profile".



2. Trading Position List (Under "Open"):

- A summary card for "XAU/USD" showing a total dynamic profit/loss matching the account scale.

- Multiple active position rows underneath:

  * Symbol: XAU/USD

  * Action details: "Sell 75.00 lot at 4,123.769" (in red/accent color for sell).

  * Dynamic Profit/Loss amount and current market price like "4,046.076".



3. Secret Configuration Menu (Hidden Panel):

- Implement a hidden state management system for custom values.

- The secret menu must NOT be visible on the normal UI. It can be triggered by a discreet action (e.g., clicking 5 times rapidly on the "Accounts" header title, or a hidden icon in a corner).

- When triggered, a clean modal or drawer pops up allowing the user to type and set custom values:

  * Custom Account Balance (e.g., entering "164,153,230.00 USD" or any other custom amount).

  * Custom Total P/L and position profits.

- Once saved, the entire dashboard instantly updates to reflect these custom figures seamlessly, keeping the interface completely clean and professional for demonstrations.



4. Visual Design & Theme:

- Deep dark blue/navy background gradients (#0b132b style).

- High-contrast text in white, subtle grey for secondary labels, electric blue accents, vivid green for positive P&L, and red for sell indicators. Fully responsive for mobile viewports.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://trade-show-showcase.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/24ca0b00-0832-4312-bf5a-415ad582fbba).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
