# SootheAI - Personalized AI Soundscapes

A Next.js web application that generates personalized AI meditation and sleep soundscapes based on user emotions.

## Features

- 🎵 **AI-Generated Soundscapes**: Create personalized ambient tracks based on your mood
- 🎨 **Beautiful Visualizer**: Animated particle system that reacts to your soundscape
- 💾 **Local Storage**: Save and replay your favorite tracks
- 📱 **Responsive Design**: Works perfectly on mobile and desktop
- ⚡ **Smooth Animations**: Built with Framer Motion for delightful interactions

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## API Integration

The app is ready for integration with AI music generation APIs:

### Riffusion API
```javascript
// Example integration in /api/generate/route.ts
const riffusionResponse = await fetch('https://api.riffusion.com/v1/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.RIFFUSION_API_KEY}`,
  },
  body: JSON.stringify({
    prompt: `ambient soundscape for ${mood}`,
    duration: 600,
    style: 'ambient'
  }),
});
```

### Mubert API
```javascript
// Example integration in /api/generate/route.ts
const mubertResponse = await fetch('https://api.mubert.com/v2/RecordTrackTTM', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    method: 'RecordTrackTTM',
    params: {
      text: `ambient music for ${mood}`,
      duration: 600,
      format: 'mp3',
      mode: 'track'
    }
  }),
});
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Add your API keys here
RIFFUSION_API_KEY=your_riffusion_api_key_here
MUBERT_API_KEY=your_mubert_api_key_here
```

## Project Structure

```
src/
├── app/
│   ├── api/generate/route.ts    # API endpoint for generating soundscapes
│   ├── globals.css              # Global styles and animations
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/
│   ├── Player.tsx               # Audio player with controls
│   └── Visualizer.tsx          # Animated visualizer component
├── hooks/
│   └── useLocalStorage.ts       # Custom hook for local storage
└── types/
    └── index.ts                 # TypeScript type definitions
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **HTML5 Audio API** - Audio playback and controls
- **Canvas API** - Custom visualizer animations

## Customization

### Adding New Mood Options
Edit the `quickMoods` array in `src/app/page.tsx`:

```typescript
const quickMoods = [
  { label: 'Your Mood', value: 'your mood description' },
  // Add more moods here
];
```

### Styling
The app uses a dark theme with purple/pink gradients. Customize colors in `src/app/globals.css`:

```css
.bg-gradient-to-br {
  background: linear-gradient(to bottom right, your-colors);
}
```

### Visualizer
Modify the particle system in `src/components/Visualizer.tsx` to change:
- Particle count
- Colors
- Movement patterns
- Wave effects

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Future Enhancements

- [ ] Stripe integration for premium features
- [ ] User accounts and cloud storage
- [ ] Social sharing of soundscapes
- [ ] Advanced audio effects
- [ ] Sleep timer functionality
- [ ] Binaural beats integration
- [ ] Voice mood detection
- [ ] Mobile app (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.