import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export default function LoginIllustration({ theme, typing, focusBoost, loginError, setLoginError, email, password, showPassword, typingPassword }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 18 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 18 });
const shakeAnimation = {
  idle: { rotate: 0 },
  shake: {
    rotate: [-8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.5 }
  },
  surprised: { rotate: 2 }
};
  const [blink, setBlink] = useState(false);

  /* 🔁 Blink every few seconds */
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => setLoginError(false), 600);
      return () => clearTimeout(timer);
    }
  }, [loginError, setLoginError]);

  const handleMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - r.left - r.width / 2) / 18);
    let yOffset = (e.clientY - r.top - r.height / 2) / 18;
    if (email.length > 0 && password.length > 0) {
      yOffset += 10; // Adjust eyes slightly up when both fields are filled
    }
    mouseY.set(yOffset);
  };

  const reset = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  /* 🎨 Theme colors */
  const colors =
    theme === "dark"
      ? {
          bg: "#1f2937",
          purple: "#8b5cf6",
          yellow: "#facc15",
          orange: "#fb923c",
          eye: "#f9fafb",
        }
      : {
          bg: "#f9fafb",
          purple: "#6d28d9",
          yellow: "#facc15",
          orange: "#fb923c",
          eye: "#111827",
        };

  const headRotate = 
    loginError ? 0 : 
    showPassword ? 0 : 
    typingPassword ? -6 : 0;

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className="w-full h-full flex items-center justify-center"
    >
      <motion.svg
  viewBox="0 0 300 300"
  className="w-[220px] sm:w-[260px] md:w-[300px]"
  variants={shakeAnimation}
  animate={{
    rotate: headRotate,
    scale: showPassword ? 1.05 : 1
  }}
  style={{ x: smoothX, y: smoothY, scale: showPassword ? 1.05 : focusBoost, rotate: loginError ? shakeAnimation.shake.rotate : headRotate }}
>
        {/* ORANGE CHARACTER */}
        <rect x="30" y="160" width="120" height="120" rx="60" fill={colors.orange} />

        {/* PURPLE CHARACTER */}
        <rect x="100" y="50" width="90" height="180" rx="20" fill={colors.purple} />

        {/* YELLOW CHARACTER */}
        <rect x="180" y="120" width="80" height="120" rx="40" fill={colors.yellow} />

        {/* EYES */}
        {/* Orange */}
        <Eye cx={80} cy={200} blink={blink} mouseX={smoothX} mouseY={smoothY} color={colors.eye} typing={typing} error={loginError} show={showPassword} typingPassword={typingPassword} />
        <Eye cx={100} cy={200} blink={blink} mouseX={smoothX} mouseY={smoothY} color={colors.eye} typing={typing} error={loginError} show={showPassword} typingPassword={typingPassword} />

        {/* Purple */}
        <Eye cx={130} cy={90} blink={blink} mouseX={smoothX} mouseY={smoothY} color={colors.eye} typing={typing} error={loginError} show={showPassword} typingPassword={typingPassword} />
        <Eye cx={150} cy={90} blink={blink} mouseX={smoothX} mouseY={smoothY} color={colors.eye} typing={typing} error={loginError} show={showPassword} typingPassword={typingPassword} />

        {/* Yellow eyes */}
        <Eye cx={205} cy={160} blink={blink} mouseX={smoothX} mouseY={smoothY} color={colors.eye} typing={typing} error={loginError} show={showPassword} typingPassword={typingPassword} />
        <Eye cx={225} cy={160} blink={blink} mouseX={smoothX} mouseY={smoothY} color={colors.eye} typing={typing} error={loginError} show={showPassword} typingPassword={typingPassword} />

        {/* Eye Covers (Hands) */}
        {typingPassword && !showPassword && (
          <>
            <EyeCover cx={80} cy={200} />
            <EyeCover cx={100} cy={200} />
            <EyeCover cx={130} cy={90} />
            <EyeCover cx={150} cy={90} />
            <EyeCover cx={205} cy={160} />
            <EyeCover cx={225} cy={160} />
          </>
        )}

        {/* Mouths */}
        <Mouth cx={90} cy={220} typing={typing} error={loginError} show={showPassword} typingPassword={typingPassword} color={colors.eye} />
        <Mouth cx={140} cy={120} typing={typing} error={loginError} show={showPassword} typingPassword={typingPassword} color={colors.eye} />
        <Mouth cx={215} cy={185} typing={typing} error={loginError} show={showPassword} typingPassword={typingPassword} color={colors.eye} />
      </motion.svg>
    </div>
  );
}

/* 👁️ Eye Component */
function Eye({ cx, cy, blink, mouseX, mouseY, color, typing, error, show, typingPassword }) {
  let radius = 4;
  let offsetX = mouseX;
  let offsetY = mouseY;

  if (blink) radius = 1;
  if (typing) radius = 5;
  if (show) radius = 6;      // 👁 widened
  if (error) radius = 3;

  // 👀 Look away when typing password
  if (typingPassword && !show) {
    offsetX = -8;
    offsetY = 0;
  }

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={color}
      style={{
        x: offsetX,
        y: offsetY,
      }}
    />
  );
}

/* ✋ Hand Component */
function EyeCover({ cx, cy, show }) {
  if (show) return null;

  return (
    <>
      <rect x={cx - 10} y={cy - 6} width="20" height="12" rx="6" fill="#000" />
    </>
  );
}

/* 👄 Mouth Component */
function Mouth({ cx, cy, typing, error, show, typingPassword, color }) {
  if (error) {
    return (
      <rect x={cx - 6} y={cy} width="12" height="2" rx="1" fill={color} />
    );
  }

  if (show) {
    // surprised "O" mouth
    return <circle cx={cx} cy={cy} r="4" fill={color} />;
  }

  if (typingPassword) {
    return <rect x={cx - 5} y={cy} width="10" height="1.5" rx="1" fill={color} />;
  }

  return typing ? (
    <ellipse cx={cx} cy={cy} rx="6" ry="4" fill={color} />
  ) : (
    <rect x={cx - 5} y={cy} width="10" height="2" rx="1" fill={color} />
  );
}
