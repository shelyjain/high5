// frontend/src/pages/Home.jsx
import { useState, useEffect, useRef, useMemo } from "react";

/**
 * Home.jsx - Modern, clean landing page
 * Simple, engaging design that highlights:
 * - CED-powered practice tests
 * - Adaptive practice
 * - Community features
 * - Study calendar & stats
 */

export default function Home() {
  const [typingText, setTypingText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const foundersRef = useRef(null);
  const canvasRef = useRef(null);

  // Shorter, punchier phrases
  const phrases = useMemo(
    () => [
      "Master AP exams with confidence",
      "Powered by official CED content",
      "Adaptive practice that works",
      "Find your passion",
    ],
    []
  );

  // Typing effect
  useEffect(() => {
    const current = phrases[phraseIndex];
    const delay = isDeleting ? 40 : 90;
    const t = setTimeout(() => {
      if (!isDeleting) {
        if (typingText.length < current.length) {
          setTypingText(current.slice(0, typingText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (typingText.length > 0) {
          setTypingText(current.slice(0, typingText.length - 1));
        } else {
          setIsDeleting(false);
          setPhraseIndex((p) => (p + 1) % phrases.length);
        }
      }
    }, delay);

    return () => clearTimeout(t);
  }, [typingText, isDeleting, phraseIndex, phrases]);

  // Simple particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);
    let rafId;
    const particles = [];
    const PARTICLE_COUNT = Math.max(20, Math.floor(width / 60));

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function createParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: rand(0, width),
          y: rand(0, height),
          vx: rand(-0.15, 0.15),
          vy: rand(-0.05, 0.05),
          r: rand(1, 3),
          alpha: rand(0.08, 0.2),
        });
      }
    }

    function resize() {
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
      createParticles();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, "rgba(0,120,200,0.05)");
      g.addColorStop(1, "rgba(0,120,200,0.02)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 9000) {
            const alpha = 0.015 * (1 - d2 / 9000);
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const elements = [heroRef.current, statsRef.current, featuresRef.current, foundersRef.current].filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.style.transform = "translateY(0px)";
            entry.target.style.opacity = "1";
            entry.target.style.transition = "opacity 650ms ease, transform 650ms ease";
          }
        }
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg, #EAF6FF 0%, #F0F8FF 40%, #FFFFFF 100%)",
      color: "#000",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingTop: "72px",
    },
    header: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "72px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      background: "rgba(255,255,255,0.8)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      zIndex: 1200,
    },
    logo: {
      color: "#0078C8",
      fontWeight: 800,
      fontSize: "20px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
    },
    nav: {
      display: "flex",
      gap: "24px",
      alignItems: "center",
    },
    navLink: {
      color: "#022037",
      fontWeight: 600,
      cursor: "pointer",
      padding: "6px 8px",
      fontSize: "16px",
    },
    getStartedBtn: {
      background: "linear-gradient(90deg, #0078C8, #2aa3f2)",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "8px",
      fontWeight: 700,
      border: "none",
      cursor: "pointer",
      boxShadow: "0 4px 16px rgba(0,120,200,0.25)",
      transition: "transform 160ms ease",
    },

    // Hero
    heroWrap: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "80px 24px 60px",
      position: "relative",
    },
    heroCanvas: {
      position: "absolute",
      inset: 0,
      zIndex: 0,
      pointerEvents: "none",
      opacity: 0.5,
    },
    heroCard: {
      position: "relative",
      zIndex: 1,
      textAlign: "center",
    },
    heroTitle: {
      fontSize: "56px",
      lineHeight: 1.1,
      margin: "0 0 20px 0",
      fontWeight: 800,
      color: "#022037",
    },
    heroGradient: {
      background: "linear-gradient(135deg, #0078C8 0%, #2aa3f2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    heroSubtitle: {
      fontSize: "22px",
      color: "#234456",
      marginBottom: "24px",
      minHeight: "32px",
      fontWeight: 600,
    },
    heroDesc: {
      fontSize: "18px",
      color: "#234456",
      maxWidth: "700px",
      margin: "0 auto 40px",
      lineHeight: 1.6,
    },

    // Stats Section
    statsSection: {
      padding: "60px 20px",
      maxWidth: "1200px",
      margin: "0 auto",
      background: "linear-gradient(135deg, #0078C8 0%, #2aa3f2 100%)",
      borderRadius: "24px",
      color: "#fff",
      textAlign: "center",
      marginBottom: "60px",
    },
    statsTitle: {
      fontSize: "32px",
      fontWeight: 800,
      marginBottom: "40px",
      color: "#fff",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "24px",
    },
    statCard: {
      padding: "24px",
    },
    statNumber: {
      fontSize: "48px",
      fontWeight: 800,
      marginBottom: "8px",
    },
    statLabel: {
      fontSize: "16px",
      opacity: 0.95,
    },

    // Features
    featuresSection: {
      padding: "60px 20px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    sectionTitle: {
      fontSize: "36px",
      fontWeight: 800,
      textAlign: "center",
      color: "#022037",
      marginBottom: "12px",
    },
    sectionSubtitle: {
      fontSize: "18px",
      textAlign: "center",
      color: "#234456",
      marginBottom: "48px",
      maxWidth: "600px",
      margin: "0 auto 48px",
    },
    featuresGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "24px",
    },
    featureCard: {
      background: "#fff",
      borderRadius: "16px",
      padding: "32px",
      border: "1px solid rgba(0,120,200,0.1)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
      transition: "transform 220ms ease, box-shadow 220ms ease",
    },
    featureIcon: {
      fontSize: "40px",
      marginBottom: "16px",
    },
    featureTitle: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#022037",
      marginBottom: "12px",
    },
    featureText: {
      color: "#234456",
      lineHeight: 1.6,
      fontSize: "15px",
    },

    // Footer
    footer: {
      padding: "40px 20px",
      textAlign: "center",
      color: "#fff",
      background: "#0078C8",
      marginTop: "60px",
    },
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div onClick={() => scrollTo("top")} style={styles.logo}>
          <img 
            src="/logo.png" 
            alt="High5 Logo" 
            style={{
              width: "28px",
              height: "28px",
              marginRight: "8px",
              borderRadius: "6px"
            }}
          />
          High5
        </div>

        <nav style={styles.nav}>
          <div style={styles.navLink} onClick={() => scrollTo("features")}>
            Features
          </div>
          <div style={styles.navLink} onClick={() => scrollTo("founders")}>
            Team
          </div>
          <button
            style={styles.getStartedBtn}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            onClick={() => (window.location.href = "/login")}
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main style={styles.heroWrap} id="top">
        <canvas
          ref={canvasRef}
          style={{ ...styles.heroCanvas, width: "100%", height: "400px", top: 0 }}
        />
        <section ref={heroRef} style={styles.heroCard}>
          <h1 style={styles.heroTitle}>
            Prepare for AP Exams with{" "}
            <span style={styles.heroGradient}>High5</span>
          </h1>

          <div style={styles.heroSubtitle}>
            {typingText}
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 24,
                background: "#0078C8",
                marginLeft: 8,
                borderRadius: 2,
                animation: "blink 1s infinite",
              }}
            />
          </div>

          <p style={styles.heroDesc}>
            Practice tests powered by official AP Course and Exam Descriptions (CED). 
            Get instant feedback and track your progress.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <button
              style={styles.getStartedBtn}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              onClick={() => (window.location.href = "/login")}
            >
              Start Practicing
            </button>
            <button
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "2px solid #0078C8",
                background: "transparent",
                cursor: "pointer",
                fontWeight: 700,
                color: "#0078C8",
                transition: "all 160ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,120,200,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onClick={() => {
                // Set guest mode in localStorage
                localStorage.setItem('isGuest', 'true');
                window.location.href = "/dashboard";
              }}
            >
              Continue as Guest
            </button>
            <button
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "2px solid #0078C8",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                color: "#0078C8",
                transition: "all 160ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,120,200,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onClick={() => scrollTo("features")}
            >
              Learn More
            </button>
          </div>
        </section>
      </main>

      {/* Stats Section */}
      <section ref={statsRef} id="stats" style={styles.statsSection}>
        <h2 style={styles.statsTitle}>Making AP Exams More Accessible</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>4.1M</div>
            <div style={styles.statLabel}>Over 4.1 million students take AP exams annually across the US</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>40</div>
            <div style={styles.statLabel}>AP courses available to explore</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>100%</div>
            <div style={styles.statLabel}>Powered by official CED content</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featuresRef} style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Everything You Need to Succeed</h2>
        <p style={styles.sectionSubtitle}>
          Tools designed to help you excel
        </p>

        <div style={styles.featuresGrid}>
          <div
            style={styles.featureCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)";
            }}
          >
            <div style={styles.featureTitle}>Official CED Content</div>
            <div style={styles.featureText}>
              All practice questions generated from official College Board Course and Exam Descriptions. 
              Real content aligned to what you'll see on exam day.
            </div>
          </div>

          <div
            style={styles.featureCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)";
            }}
          >
            <div style={styles.featureTitle}>Adaptive Learning & Insights</div>
            <div style={styles.featureText}>
              AI-powered practice adapts to your strengths and weaknesses. Get instant feedback and detailed 
              stats to track your progress and focus on what needs improvement.
            </div>
          </div>

          <div
            style={styles.featureCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)";
            }}
          >
            <div style={styles.featureTitle}>Study Calendar</div>
            <div style={styles.featureText}>
              Plan your study sessions and stay organized. Set goals and track 
              your progress toward exam day.
            </div>
          </div>

          <div
            style={styles.featureCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)";
            }}
          >
            <div style={styles.featureTitle}>Flashcards</div>
            <div style={styles.featureText}>
              Create and study personalized flashcards to help you memorize key concepts, 
              terms, and definitions for your AP exams.
            </div>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section id="founders" ref={foundersRef} style={{ padding: "60px 20px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#022037", marginBottom: 48, textAlign: "center" }}>
          Built by Students, for Students
        </h2>
        <div style={{ display: "flex", flexDirection: "row", gap: "24px", alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px", background: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)", width: "280px" }}>
            <img 
              src="/vaidehi.png" 
              alt="Vaidehi Akbari" 
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#022037", marginBottom: 8 }}>Vaidehi Akbari</div>
              <div style={{ color: "#234456", fontSize: 14, lineHeight: 1.5 }}>
                Machine learning enthusiast who enjoys coding with Python and Unity. Practices taekwondo and loves combining creativity with technology.
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px", background: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)", width: "280px" }}>
            <img 
              src="/sanjana.png" 
              alt="Sanjana Gowda" 
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "center 30%"
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#022037", marginBottom: 8 }}>Sanjana Gowda</div>
              <div style={{ color: "#234456", fontSize: 14, lineHeight: 1.5 }}>
                Full-stack engineer passionate about AI and machine learning. Swimmer and co-president of Girls Who Code who loves advocating for women in STEM.
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px", background: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)", width: "280px" }}>
            <img 
              src="/shely.png" 
              alt="Shely Jain" 
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#022037", marginBottom: 8 }}>Shely Jain</div>
              <div style={{ color: "#234456", fontSize: 14, lineHeight: 1.5 }}>
                AI enthusiast who loves working with Python and machine learning. Volleyball player and co-president of Girls Who Code passionate about coding.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 18 }}>High5</div>
          <div style={{ opacity: 0.95, fontSize: 14 }}>
            2025 High5. Making AP exam preparation more accessible for students everywhere.
          </div>
        </div>
      </footer>
    </div>
  );
}
