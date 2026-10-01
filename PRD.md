# PRD — E-Commerce Shop (MVP)

Defines WHAT and the user experience. `AGENTS.md` defines HOW. Schema is defined by `supabase/migrations/`. If they conflict, see the precedence rule in `AGENTS.md`.

## 1. Overview and goals

A simple, trustworthy online shop where a customer can discover products, add them to a cart, sign in with Google, check out, receive a confirmation email, and see their order history. It should feel like a real store, not a tech demo.

Goals: easy discovery; clear prices and availability; effortless cart; low-friction checkout; clear feedback after every important action; works well on phones.

## 2. Scope

**MVP:** homepage + product grid, product details, cart, Google sign-in, checkout, order confirmation page, confirmation email, order history, account page.

**Not in MVP:** online payment, shipping calculation, search, categories, filters, image galleries, reviews, wishlist, discount codes, admin dashboard, analytics, database-backed cart, recommendations.

**Payment decision:** version 1 does not collect payment. "Place Order" creates an order with status **Pending**. Do not show fake shipping, tax or payment steps. The total equals the sum of item prices.

## 3. User and journey

Primary user: an online shopper on phone or desktop who needs to know: what is this, how much, is it available, can I buy it, what happens next.

```text
Home → Product → Add to cart → Cart → Checkout → Sign in with Google → Details → Place order → Confirmation → Orders
```

## 4. Navigation

Header on every page: store name (links Home), **Home**, **Cart** (with item count), **Orders** (when signed in), **Account** / **Sign in**. Current page is visibly indicated. Compact menu on mobile. Simple footer with store name.

## 5. Pages

**Home.** Short hero (what the store sells + one "Shop now" button), then the product grid.

**Product card.** Image, name, price (₦15,000 format), availability, Add to cart. Clicking the card opens details. Add to cart shows "✓ Added to cart" without leaving the page and updates the navbar count.

**Product details.** Image, name, price, description, availability, quantity selector (1 to available stock), Add to cart (primary), Continue shopping (secondary). One image per product; show a neutral placeholder if missing or broken.

**Availability.** In Stock (stock > 5), Low Stock (1–5, e.g. "Only 3 left"), Out of Stock (0). Out-of-stock products cannot be added to the cart; the button is disabled and says why.

**Cart.** Each line: image, name, unit price, quantity controls, line subtotal, Remove. Summary: Subtotal and Total. Quantity can't go below 1 or above stock; show a message when the limit is reached. Removing shows "Item removed". Empty state: "Your cart is empty." with a Continue shopping button. Cart persists across refreshes.

**Login.** Explains why sign-in is needed ("Sign in to continue"), one button: **Continue with Google**. After signing in, return the user to where they were (e.g. checkout).

**Checkout.** Requires sign-in. Two areas: *Your details* and *Order summary* (side by side on desktop, stacked on mobile).
Fields, all required, each with a visible label: Full name, Email (pre-filled from Google, editable), Phone number, Delivery address.
Validation messages say what's wrong and what to do ("Please enter your full name."), appear next to the field, and are linked to it for screen readers.
Summary shows each item, quantity, price, and a prominent Total. Button: **Place Order**; while processing: **Processing Order...** and disabled.
Pending/unavailable stock: if the server rejects the order for stock, say which product and how many remain.
Failure: "We couldn't complete your order. Your cart has been saved. Please try again." Never show raw errors.

**Order placed (success).** Heading "Order Placed". Show order number, email, total, status (Pending), and a confirmation line. If the email was sent: "We've sent a confirmation to {email}." If not: "Your order is placed. We couldn't send the confirmation email, but you can see it under Orders." Buttons: Continue shopping, View orders.

**Orders.** List of the signed-in user's orders: order number, date, total, status. Empty state: "You haven't placed any orders yet." with Start shopping. Selecting an order may show its items (name, quantity, price paid).

**Account.** Name, email, link to Orders, Sign out.

## 6. States (every data-driven screen)

Loading ("Loading products..."), error (friendly message + Try again button), and empty (No products: "No products are available right now."). Buttons that trigger network actions are disabled while running.

## 7. Confirmation email

Sent after a successful order. Contains: customer name, order number, each item with quantity and price, total, status, store name. Plain and readable.

## 8. Design direction

Modern, clean, product-focused, uncluttered. One primary colour for main actions, neutral greys for text and borders, clear success/warning/error colours (never colour alone: add text or icons). One readable sans-serif font, a consistent spacing scale and corner radius, subtle shadows. Product images keep a consistent aspect ratio without distortion.

Responsive, designed mobile-first: product grid 1–2 columns on phones, 2–3 on tablets, 3–4 on desktop; checkout single column on mobile; no horizontal scrolling; tap targets comfortably large.

## 9. Accessibility (fundamentals)

Semantic HTML, proper heading order, keyboard-usable everything, visible focus outlines, sufficient contrast, labelled form fields with errors tied to fields, meaningful alt text on product images.

## 10. Currency

Nigerian Naira, always formatted the same way: `₦15,000`.

## 11. User stories and acceptance criteria

| Story | Done when |
|---|---|
| Browse products | Products show image, name, price, availability; each opens details |
| View details | Details, price, availability, quantity selector, Add to cart all present |
| Add to cart | Feedback shown, count updates, item appears in cart |
| Manage cart | Quantity up/down, remove, totals update, survives refresh |
| Sign in | Google button visible, signing in returns to the right place, sign out works |
| Checkout | Required fields marked, errors explained, summary + total visible, duplicate clicks create one order |
| Confirmation | Success page shows order number, total, honest email status |
| Order history | Own orders only, with number, date, total, status |

## 12. MVP acceptance journey

A new customer, without help, can: open the store → browse → open a product → add to cart → change quantity → go to checkout → sign in with Google → fill details → place order → see confirmation → receive the email (to an authorised test address) → open Orders and find the new order.

## 13. Later

Online payment, shipping, search/categories, admin dashboard, DB-backed cart, saved addresses, reviews, discount codes.
