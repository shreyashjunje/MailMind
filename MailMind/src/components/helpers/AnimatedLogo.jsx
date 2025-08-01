// AnimatedLogoImage.jsx
import React from "react";
import { motion } from "framer-motion";
import logo from "../../assets/logo1.png"; // Adjust the path as necessary

const AnimatedLogoImage = () => {
  return (
    <motion.img
      src={logo} // if in public folder. Or use import if from src/assets
      alt="MailMind Logo"
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      whileHover={{ scale: 1.20, rotate: 1 }}
    //   className="w-60" // You can adjust width here
        width={60} // Adjust width as necessary
    />
  );
};

export default AnimatedLogoImage;
