# Monopoly Deal — Game Design Document

## Overview
Monopoly Deal is a multiplayer card game for 2–5 players. First player to collect **3 complete property sets** of different colors wins.

## The Deck (110 cards total)

### Money Cards (20)
| Value | Count |
|-------|-------|
| $1M   | 6     |
| $2M   | 5     |
| $3M   | 3     |
| $4M   | 3     |
| $5M   | 2     |
| $10M  | 1     |

### Property Cards (28)
| Color      | Set Size | Cards | Rent (by # in set) |
|------------|----------|-------|---------------------|
| Brown      | 2        | 2     | $1, $2              |
| Light Blue | 3        | 3     | $1, $2, $3          |
| Pink       | 3        | 3     | $1, $2, $4          |
| Orange     | 3        | 3     | $1, $3, $5          |
| Red        | 3        | 3     | $2, $3, $6          |
| Yellow     | 3        | 3     | $2, $4, $6          |
| Green      | 3        | 3     | $2, $4, $7          |
| Dark Blue  | 2        | 2     | $3, $8              |
| Railroad   | 4        | 4     | $1, $2, $3, $4      |
| Utility    | 2        | 2     | $1, $2              |

### Wild Property Cards (11)
- Rainbow wild x 2 — any color, immune to Sly Deal
- Light Blue / Railroad x 2
- Pink / Orange x 2
- Red / Yellow x 2
- Green / Dark Blue x 1
- Dark Blue / Railroad x 1
- Light Blue / Brown x 1

### Action Cards (34)
| Card             | Count | Effect                                              |
|------------------|-------|------------------------------------------------------|
| Pass Go          | 10    | Draw 2 extra cards                                   |
| Deal Breaker     | 2     | Steal a COMPLETE property set from any player        |
| Sly Deal         | 3     | Steal 1 property NOT in a complete set (not rainbow) |
| Forced Deal      | 4     | Swap 1 of your properties with 1 opponent property   |
| Debt Collector   | 3     | One player pays you $5M                              |
| It's My Birthday | 3     | ALL other players pay you $2M each                   |
| Just Say No      | 3     | Cancel any action targeting you                      |
| Double the Rent  | 2     | Double the rent charged                              |
| House            | 3     | Add to complete set, rent +$3M                       |
| Hotel            | 2     | Add to complete set with house, rent +$4M            |

### Rent Cards (13)
| Card                  | Count | Targets     |
|-----------------------|-------|-------------|
| Any Color Rent        | 3     | ONE player  |
| Brown/Light Blue Rent | 2     | ALL players |
| Pink/Orange Rent      | 2     | ALL players |
| Red/Yellow Rent       | 2     | ALL players |
| Green/Dark Blue Rent  | 2     | ALL players |
| Railroad/Utility Rent | 2     | ALL players |

## Rules

### Setup
- Shuffle deck, deal 5 cards to each player
- Each player has: hand (hidden), bank (face-up money), property area (face-up cards by color)

### Turn Structure
1. Draw 2 cards (if hand empty at start, draw 5)
2. Play up to 3 cards in any order
3. Discard down to 7 if over

### Playing Cards
- As **property** → place in property area
- As **money** → place in bank
- As **action** → resolve effect, discard

### Paying Debts
- Pay from bank first, then properties
- Pay exact or everything if insufficient — no change
- Properties go to collector's area, money to collector's bank

### Just Say No
- Cancels any action targeting you
- Free — does not count as a play
- Can be countered by opponent's JSN
- Chain until one side stops

### Wild Cards
- Place in any valid color group
- Can be moved between groups during your turn (free)
- Rainbow wilds: any color, cannot be stolen by Sly Deal

### House & Hotel
- House: complete set only, rent +$3M
- Hotel: complete set with house, rent +$4M, house goes to bank as $3M
- Travel with set if stolen

### Win Condition
First player with 3 complete property sets of 3 different colors wins immediately.
