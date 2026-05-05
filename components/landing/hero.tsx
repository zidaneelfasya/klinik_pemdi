import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare } from "lucide-react";
import ChatPreview from "./chat-preview";
import Link from "next/link";

export function Hero() {
	return (
		<section
			id="beranda"
			className="relative overflow-hidden bg-background pt-16 md:pt-32 pb-16 md:pb-32"
		>
			{/* Background decoration */}
			<div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
			<div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>

			<div className="max-w-6xl mx-auto px-4 md:px-6">
				<div className="grid md:grid-cols-2 gap-12 items-center">
					{/* Left Content */}
					<div className="flex flex-col gap-6">
						<div className="inline-flex items-center gap-2 bg-primary/10 text-primary w-fit px-3 py-1 rounded-full">
							<MessageSquare className="w-4 h-4" />
							<span className="text-sm font-medium">
								Konsultasi Digital 24/7
							</span>
						</div>

						<div>
							<h1 className="text-4xl md:text-5xl font-bold text-balance leading-tight text-foreground mb-4">
								Layanan Konsultasi Digital Pemerintah Daerah Berbasis Online
							</h1>
							<p className="text-lg text-muted-foreground text-balance">
								Dukung implementasi SPBE dan percepat akses informasi teknis
								melalui konsultasi online.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 pt-4">
							<Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-auto py-3 md:h-12 text-sm md:text-base px-6" asChild>
								<Link href="/konsultasi-form">
									Mulai Konsultasi
									<ArrowRight className="w-4 h-4" />
								</Link>
							</Button>

						</div>
					</div>

					{/* Right Illustration */}
					<div className="relative h-96 md:h-full">
						<ChatPreview />
					</div>
				</div>
			</div>
		</section>
	);
}
