# AI Trends & TripBuilt Opportunities (March 2026)

> Analysis of RunPod's "State of AI" report (March 2026) mapped to TripBuilt product opportunities.
> Source: RunPod platform data — 500,000+ developers, 183 countries, anonymized serverless traffic & GPU utilization.

---

## Key Market Signals

### 1. Open-Source LLMs: Qwen Dethroned Llama

- **Qwen** is now the #1 self-hosted LLM, surpassing Meta's Llama family
- Llama 4 adoption is shockingly low — Llama 2 has 3x more usage than Llama 4
- Most Llama usage is still on 3.x (community fine-tunes, not the base model)
- **vLLM** runs 50% of text-only endpoints — the serving infrastructure debate is settled

### 2. Image Generation: Stable Diffusion Dominates, Flux Rising

- Stable Diffusion powers **67%** of image endpoints
- Flux endpoint creation **quadrupled** in H2 2025 — projected to capture 33%+ by mid-2026
- SD3 has failed to gain traction
- **ComfyUI** runs 2/3 of all image workflows — de facto standard
- LLMs (Qwen/GPT-4o) are being embedded in image pipelines for auto-prompting and visual databases

### 3. Video Generation: "Draft Then Refine"

- **Wan** owns 43% of open-source video generation
- **LTX** grew 15x since November (fastest grower after LTX-2 release)
- **70%** of video endpoints also do upscaling — generate low-res, cherry-pick, upscale winners
- Image-to-video > text-to-video (reference images give more control)
- Real-time generation is several years out for production use cases

### 4. Audio: Transcription Dwarfs Generation

- Transcription is **6x more common** than text-to-speech
- **Whisper** powers 2/3 of audio endpoints
- TTS market is completely fragmented — top model (XTTS) has only 7% share
- Audio workflows remain Python-native/PyTorch-based (no ComfyUI equivalent)

### 5. GPU Economics Improving Fast

- **H200** overtook H100 in May 2025 for GPU hours
- **B200** usage grew 25x through 2025; price dropped 35% ($7.99 to $5.19)
- H100/H200 supply projected to double by mid-2026; B200 to quadruple
- Self-hosting ROI is improving rapidly for smaller teams

### 6. Geographic & Industry Distribution

- 183 countries — US leads (25%), **India is #2 (7%)**, Europe ~33%
- **2/3 of users are NOT AI-native** — research, professional services, healthcare, fintech, marketing
- AI infrastructure is becoming utility computing across industries

### 7. Emerging Patterns

- **Agentic AI** frameworks (LangChain, CrewAI, AutoGen) appearing in serverless workloads — still early
- **RAG** is the standard for domain-specific LLM grounding (BGE/Qwen Embeddings + FAISS/Chroma)
- **LoRA/QLoRA** has democratized fine-tuning — paired with Unsloth for optimized training

---

## TripBuilt Opportunities

### Whisper + WhatsApp Voice (Priority: NOW)

**Signal**: Whisper powers 2/3 of audio endpoints; India is a voice-heavy market.

- Let clients send WhatsApp voice messages, transcribe with Whisper, extract travel intent, generate itineraries
- Transcribe driver voice updates for real-time trip status
- Whisper handles Hindi, Tamil, and other Indian languages
- Cost: free to self-host; pennies per minute on serverless
- Builds on existing WhatsApp integration (Meta Cloud API)

### Qwen for RAG — Replace OpenAI (Priority: NEXT QUARTER)

**Signal**: Qwen is #1 open-source LLM; GPU prices dropping 35% YoY.

- Self-hosted Qwen endpoint could dramatically cut costs for itinerary generation and recommendations
- Qwen Embeddings for vector search in RAG pipelines
- Cost breakeven for self-hosting vs. OpenAI API is shifting fast — especially at India-scale pricing

### RAG on Supabase pgvector (Priority: NEXT QUARTER)

**Signal**: RAG is the standard for domain-specific grounding.

- Ingest destination guides, hotel reviews, visa requirements, local tips
- Ground LLM responses in actual booking history + destination data from 113 Supabase tables
- Stack: Qwen Embeddings -> Supabase pgvector (already have Postgres) -> Qwen for generation
- Enhances existing `rag-assistant/` and `agents/` directories

### AI Destination Imagery (Priority: LATER)

**Signal**: ComfyUI dominates; LLMs embedded in image pipelines.

- Generate stylized destination previews when Wikipedia images aren't available
- Personalized itinerary cover images based on destinations
- Marketing automation: auto-generate social visuals for trip packages
- Current Wikipedia image approach works — this is a differentiation play

### Agentic Booking Flows (Priority: LATER)

**Signal**: Agentic frameworks are emerging in production.

- Multi-agent trip planning: specialized agents for flights, hotels, activities, logistics
- Autonomous booking: client request -> itinerary -> booking -> confirmation -> WhatsApp notification
- LoRA fine-tuning on booking data for better travel recommendations

### Video Generation (Priority: WATCH)

**Signal**: Video is "draft then refine"; not production-ready for most use cases.

- Future: destination preview videos from activity photos (Wan/LTX)
- Future: short WhatsApp marketing clips
- Wait 12-18 months for the tech to mature

---

## Priority Matrix

| Opportunity | Impact | Effort | Timeline |
|------------|--------|--------|----------|
| Whisper + WhatsApp voice | High | Low | Now |
| Qwen for RAG (replace OpenAI) | High | Medium | Next quarter |
| RAG on Supabase pgvector | High | Medium | Next quarter |
| AI destination imagery | Medium | Medium | Later |
| Agentic booking flows | High | High | Later |
| Video generation | Low | High | Watch |

---

*Analysis date: 2026-03-22. Source: RunPod "State of AI" report, March 2026.*
