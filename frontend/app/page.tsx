"use client"
import Link from "next/link"
import { ArrowRight, Box, Cpu, Zap, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"

// --- COMPONENTS ---

// Robust Video Component with Fallback
function VideoCard({ src, fallback, className = "" }: { src: string, fallback: string, className?: string }) {
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && !hasError) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked handling
      })
    }
  }, [hasError])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!hasError ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          src={src}
          onError={(e) => {
            console.error("Video failed to load:", src)
            setHasError(true)
          }}
        />
      ) : (
        <div className="w-full h-full relative">
          <img src={fallback} alt="Fallback Visual" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white text-xs bg-black/80 px-2 py-1">Video Source Blocked</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { scrollY } = useScroll()

  // Parallax for hero text
  const yText = useTransform(scrollY, [0, 500], [0, 150])
  const opacityText = useTransform(scrollY, [0, 300], [1, 0])

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  if (!mounted) return <div className="min-h-screen bg-white" />

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-black selection:bg-orange-500 selection:text-white">

      {/* --- HERO SECTION --- */}
      <section className="relative h-screen flex flex-col justify-center px-6 lg:px-12 border-b border-gray-100 overflow-hidden">

        {/* Full Screen Background Video */}
        <div className="absolute inset-0 z-0 bg-black">
          <VideoCard
            // STABLE TEST URL: Elephant's Dream (Open Source) - Reliable CDN
            // Replaced Pexels link which was 403 Forbidden
            src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
            fallback="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full opacity-60 mix-blend-luminosity" // Industrial gritty look
          />
          {/* Overlay for Text Readability */}
          <div className="absolute inset-0 bg-white/70 mix-blend-hard-light backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent"></div>
        </div>

        <motion.div
          style={{ y: yText, opacity: opacityText }}
          className="relative z-10 max-w-4xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-1 bg-orange-500"></div>
            <span className="text-sm font-bold tracking-widest uppercase text-black">The Modern Foundry</span>
          </div>

          <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85] text-black">
            HARDWARE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">EVOLVED.</span>
          </h1>

          <p className="text-2xl text-black/80 max-w-xl mb-12 font-bold leading-relaxed border-l-4 border-orange-500 pl-6">
            Identify parts. Generate schematics. Visualize in 3D. <br />
            All from a single prompt.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/signup">
              <Button className="h-16 px-12 text-xl bg-black text-white hover:bg-orange-600 rounded-none transition-all duration-300 shadow-2xl hover:translate-x-1">
                Launch Platform <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
            <Link href="/gallery">
              <Button variant="outline" className="h-16 px-12 text-xl border-4 border-black text-black hover:bg-black hover:text-white rounded-none transition-all font-bold">
                View Gallery
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 right-12 hidden lg:flex items-center gap-4 z-20"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs font-bold text-black rotate-90 origin-right translate-y-4">SCROLL</span>
          <div className="w-[1px] h-24 bg-black"></div>
        </motion.div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 px-6 lg:px-12 bg-white relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {[
            { icon: Cpu, title: "AI Identification", desc: "Instant component recognition & voltage matching." },
            { icon: Activity, title: "Auto-Routing", desc: "Schematics generated with industrial precision." },
            { icon: Box, title: "3D Fabrication", desc: "Preview assembly in a real-time 3D viewport." }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group border-t-2 border-gray-100 pt-8 hover:border-orange-500 transition-colors duration-300"
            >
              <div className="mb-6">
                <f.icon className="w-12 h-12 text-black group-hover:text-orange-500 transition-colors duration-300" />
              </div>
              <h3 className="text-3xl font-bold mb-4">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed text-lg font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- PROTOTYPE VIDEO SECTION --- */}
      <section className="py-24 bg-gray-50 border-y border-gray-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center text-center">

          <h2 className="text-4xl md:text-6xl font-black mb-16 tracking-tight uppercase">
            From <span className="text-orange-500 underline decoration-4 underline-offset-8">Prompt</span> to <span className="text-black">Prototype</span>
          </h2>

          {/* Video Card with Fallback */}
          <div className="relative w-full max-w-6xl aspect-video bg-black shadow-2xl border-4 border-white outline outline-1 outline-gray-200">
            <VideoCard
              // STABLE TEST URL: Tears of Steel (Sci-Fi/Tech) - Reliable CDN
              // Replaced BigBuckBunny with something more "engineering" themed
              src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
              fallback="https://images.unsplash.com/photo-1581093458791-9f302e6d8a6b?q=80&w=2070&auto=format&fit=crop"
              className="w-full h-full opacity-90"
            />

            {/* Tech Overlay */}
            <div className="absolute top-6 left-6 flex gap-3">
              <div className="px-4 py-2 bg-orange-500 text-white text-sm font-bold uppercase tracking-wider shadow-lg">Live Feed</div>
              <div className="px-4 py-2 bg-black/50 backdrop-blur text-white text-sm font-mono border border-white/20">CAM_01</div>
            </div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 bg-fixed pointer-events-none"></div>
          </div>

          <div className="mt-20 text-center">
            <p className="text-black/60 mb-10 max-w-2xl mx-auto text-xl font-medium">
              Seamlessly bridge the gap between software design and hardware reality.
              Export manufacturing files directly to your factory or 3D printer.
            </p>
            <Link href="/signup">
              <Button size="lg" className="h-20 px-16 bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold rounded-none shadow-xl shadow-orange-500/20 hover:scale-105 transition-transform">
                Start Engineering
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-black text-white py-24 px-6 lg:px-12 border-t-4 border-orange-500">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <h2 className="text-4xl font-black tracking-tighter mb-6 text-white">PRAWLER.</h2>
            <p className="text-gray-400 max-w-sm text-lg">
              The autonomous hardware engineering agent.
              <br />Build the future, faster.
            </p>
          </div>
          <div className="flex gap-12 text-lg font-bold text-gray-500">
            <Link href="#" className="hover:text-orange-500 transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-orange-500 transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-orange-500 transition-colors">Contact</Link>
          </div>
        </div>
        <div className="mt-24 pt-8 border-t border-white/10 text-sm text-gray-600 flex justify-between font-mono">
          <span>© 2026 Prawler Industries</span>
          <span>SYSTEM STATUS: <span className="text-green-500 blink">OPERATIONAL</span></span>
        </div>
      </footer>

    </div>
  )
}
