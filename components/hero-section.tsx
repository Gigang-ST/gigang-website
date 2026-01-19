"use client";

import { LiquidButton } from "@/components/ui/liquid-glass-button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import heroLqip from "@/lib/hero-lqip.json";
import { Menu, ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { siteContent } from "@/config";

const heroLqipMap = heroLqip as Record<string, string>;
const fallbackHeroSources = Array.from(
  { length: 10 },
  (_, index) => `/images/hero/hero${index + 1}.jpeg`,
);
const heroSources =
  Object.keys(heroLqipMap).length > 0
    ? Object.keys(heroLqipMap).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      )
    : fallbackHeroSources;

const baseSlides = heroSources.map((image, index) => ({
  image,
  alt: `${siteContent.hero.slideAltPrefix} ${index + 1}`,
  blurDataURL: heroLqipMap[image] ?? "",
}));

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const slides = baseSlides;

  const navItems = siteContent.navigation.items;

  // Navigation handlers
  const nextSlide = () => carouselApi?.scrollNext();
  const prevSlide = () => carouselApi?.scrollPrev();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const handleSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    handleSelect();
    carouselApi.on("select", handleSelect);
    carouselApi.on("reInit", handleSelect);

    return () => {
      carouselApi.off("select", handleSelect);
      carouselApi.off("reInit", handleSelect);
    };
  }, [carouselApi]);

  return (
    <div
      id="hero"
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      {/* Background Image */}
      <Carousel
        className="absolute inset-0 h-full w-full"
        opts={{ loop: true, align: "start" }}
        setApi={setCarouselApi}
      >
        <CarouselContent className="w-full">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.image}
              className="relative h-screen w-full"
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover blur-sm scale-105 transition-all duration-1000 ease-in-out"
                placeholder={slide.blurDataURL ? "blur" : "empty"}
                blurDataURL={slide.blurDataURL || undefined}
              />
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40" />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6 md:p-8">
        {/* Logo/Brand */}
        <div className="text-white font-bold text-xl tracking-wider">
          {siteContent.brand.shortName}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(item.href)}
              className="relative text-white hover:text-gray-300 transition-colors duration-300 font-medium tracking-wide pb-1 group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 ease-out group-hover:w-full"></span>
            </button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white hover:text-gray-300 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          <span className="sr-only">{siteContent.navigation.toggleLabel}</span>
        </button>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/90 z-30 md:hidden">
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="text-white text-2xl font-bold tracking-wider hover:text-gray-300 transition-colors duration-300"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero Content */}
      <div className="relative z-10 flex h-full items-center justify-center px-6">
        <div className="text-center text-white max-w-4xl">
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-wider mb-4 leading-none">
            {siteContent.hero.titleLines.map((line, index) => (
              <span key={line}>
                {line}
                {index < siteContent.hero.titleLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-light tracking-wide mb-8 text-gray-200">
            {siteContent.hero.subtitle}
          </p>

          {/* CTA Button - Now using LiquidButton */}
          <LiquidButton
            size="xxl"
            className="font-semibold text-lg tracking-wide"
            onClick={() => scrollToSection("#join")}
          >
            {siteContent.hero.ctaLabel}
          </LiquidButton>
        </div>
      </div>

      {/* Slider Navigation */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-4">
          {/* Previous Arrow */}
          <button
            onClick={prevSlide}
            className="text-white hover:text-gray-300 transition-colors p-2"
            aria-label={siteContent.hero.aria.previousSlide}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Slide Indicators */}
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "bg-white"
                    : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`${siteContent.hero.aria.goToSlidePrefix} ${index + 1}`}
              />
            ))}
          </div>

          {/* Next Arrow */}
          <button
            onClick={nextSlide}
            className="text-white hover:text-gray-300 transition-colors p-2"
            aria-label={siteContent.hero.aria.nextSlide}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
