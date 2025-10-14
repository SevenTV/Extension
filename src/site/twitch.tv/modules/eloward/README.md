# EloWard Integration for 7TV Extension

This module integrates EloWard League of Legends rank badges into the 7TV browser extension, displaying player ranks next to usernames in Twitch chat.

## Features

- **Automatic Rank Detection**: Fetches League of Legends rank data from EloWard's API
- **Game-Aware Display**: Only shows badges on League of Legends streams (configurable)
- **Smart Caching**: Caches rank data to reduce API calls and improve performance
- **Animated Badges**: Supports animated badges for high ranks (Master, Grandmaster, Challenger)
- **Interactive Tooltips**: Shows detailed rank information on hover
- **Native Integration**: Uses 7TV's existing badge system and styling

## Module Structure

```
src/site/twitch.tv/modules/eloward/
├── EloWardModule.vue              # Main module entry point
├── composables/
│   ├── useEloWardRanks.ts        # Rank data management and API calls
│   └── useGameDetection.ts       # League of Legends stream detection
└── components/
    ├── EloWardBadge.vue          # Rank badge component
    └── EloWardTooltip.vue        # Tooltip component
```

## Configuration Options

The module provides several configuration options accessible through 7TV's settings:

- **Enable EloWard Rank Badges**: Toggle the feature on/off
- **Show Only on League Streams**: Only display badges when watching League of Legends
- **Animated Badges**: Use animated badges for high ranks
- **Show Rank Tooltips**: Display detailed information on hover
- **Cache Duration**: How long to cache rank data (5-60 minutes)

## API Integration

The module fetches rank data from EloWard's public API:
```
GET https://api.eloward.com/ranks/lol/{username}
```

Response format:
```json
{
  "rank_tier": "DIAMOND",
  "rank_division": "II",
  "lp": 75,
  "riot_id": "SummonerName",
  "region": "NA",
  "animate_badge": false
}
```

## Integration Points

### UserTag Component
The main integration point is the `UserTag.vue` component, which displays user information in chat messages. EloWard badges are added to the existing badge list alongside Twitch and 7TV badges.

### Game Detection
The module hooks into Twitch's stream information to detect when a League of Legends stream is active, using the game ID `21779` or game name "League of Legends".

### Caching System
Implements a smart caching system that:
- Stores rank data locally to reduce API calls
- Respects cache duration settings
- Automatically evicts old entries when cache is full
- Clears cache when switching channels

## Performance Considerations

- **Lazy Loading**: Only fetches rank data for visible users with `loading="lazy"` on images
- **Request Deduplication**: Prevents duplicate API calls for the same username
- **LRU Cache**: Implements Least Recently Used eviction with access counting
- **Debounced Fetching**: 100ms debounce prevents excessive API calls during rapid changes
- **Memory Management**: Automatic cleanup of pending requests and cache entries
- **Error Boundaries**: Graceful error handling with development-only logging
- **Optimized Rendering**: Minimal re-renders using efficient Vue reactivity

## Usage

Once installed, the module automatically:
1. Detects League of Legends streams
2. Fetches rank data for chat users
3. Displays rank badges next to usernames
4. Shows tooltips with detailed rank information

Users can configure the behavior through 7TV's settings panel under the "Chat" → "EloWard" section.

## Production Optimizations

The implementation includes several production-grade optimizations:

### Memory Management
- **LRU Cache**: Uses access counting for intelligent cache eviction
- **Request Deduplication**: Prevents duplicate API calls for the same username
- **Automatic Cleanup**: Clears pending requests and cache on channel changes

### Performance
- **Debounced Fetching**: 100ms debounce prevents API spam during rapid changes
- **Lazy Image Loading**: Uses `loading="lazy"` for optimal image loading
- **Efficient Reactivity**: Minimal Vue re-renders using direct config access

### Error Handling
- **Development-Only Logging**: Console logs only appear in development mode
- **Graceful Degradation**: Continues working even if API fails
- **Network Resilience**: Handles timeouts and network errors gracefully

### Code Quality
- **TypeScript**: Full type safety with proper interfaces
- **Constants**: Extracted magic numbers and strings to constants
- **Clean Architecture**: Separation of concerns with composables and components

## Development

To modify or extend the integration:

1. **Adding New Features**: Extend the `useEloWardRanks` composable
2. **Styling Changes**: Modify the badge and tooltip components
3. **API Changes**: Update the fetch logic in `useEloWardRanks.ts`
4. **Game Detection**: Extend `useGameDetection.ts` for additional games

## Dependencies

- Vue 3 Composition API
- 7TV's existing composables (`useConfig`, `useChannelContext`, etc.)
- EloWard's public API
- Twitch's stream information API
