import AboutSection from "@/components/about-section";
import FeatureSection from "@/components/feature-section";
import { Header } from "@/components/header";
import HeroSection from "@/components/hero-coba";
import React from "react";

// Force dynamic rendering to prevent build-time SSG errors
export const dynamic = 'force-dynamic';

const page = () => {
	return (
		<div>
			<Header />
			<HeroSection />
			<AboutSection />
			<FeatureSection />
		</div>
	);
};

export default page;
