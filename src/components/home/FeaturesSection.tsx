"use client";

import { motion } from "framer-motion";
import {
  TruckIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: TruckIcon,
    title: "משלוח מהיר",
    description: "משלוח לכל הארץ תוך 24-48 שעות",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: CurrencyDollarIcon,
    title: "מחירים תחרותיים",
    description: "המחירים הטובים ביותר בשוק, מובטח",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: ShieldCheckIcon,
    title: "אחריות מלאה",
    description: "אחריות יצרן על כל המוצרים",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "שירות אישי",
    description: "מענה מהיר בוואטסאפ ובטלפון",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: ClockIcon,
    title: "מלאי בזמן אמת",
    description: "מערכת מלאי מתעדכנת אוטומטית",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: SparklesIcon,
    title: "מוצרים מייבוא",
    description: "טמבונים משומשים באיכות מעולה",
    color: "bg-pink-50 text-pink-600",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text mb-4">
            למה <span className="text-primary">DTM PARTS</span>?
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            אנחנו מספקים את חווית הקנייה הטובה ביותר לחלקי רכב בישראל
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="bg-surface rounded-2xl border border-border p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">
                {feature.title}
              </h3>
              <p className="text-text-secondary text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
