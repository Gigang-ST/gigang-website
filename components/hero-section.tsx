"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { HeroTypography } from "@/components/hero-typography";
import heroLqip from "@/lib/hero-lqip.json";
import { bodyFont } from "@/lib/fonts";
import Fade from "embla-carousel-fade";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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

type HeroSectionProps = {
  showHeroContent?: boolean;
  showSliderNav?: boolean;
  overlay?: ReactNode;
};

export default function HeroSection({
  showHeroContent = true,
  showSliderNav = true,
  overlay,
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const fadePlugins = useMemo(() => [Fade()], []);

  const slides = baseSlides;
  const heroSubtitleLines = siteContent.hero.subtitleLines ?? [];

  const navItems = siteContent.navigation.items;
  const isHashLink = (href: string) => href.startsWith("#");
  const isExternalLink = (href: string) => /^https?:\/\//.test(href);

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

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const intervalId = window.setInterval(() => {
      carouselApi.scrollNext();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
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
        opts={{ loop: true, align: "start", duration: 30 }}
        setApi={setCarouselApi}
        plugins={fadePlugins}
      >
        <CarouselContent className="w-full cursor-grab active:cursor-grabbing">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.image}
              className="relative h-screen w-full"
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                draggable={false}
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
        <div className="flex items-center gap-3 text-white font-bold text-xl tracking-wider">
          <Image
            src="/logo.webp"
            alt={`${siteContent.brand.shortName} logo`}
            width={36}
            height={36}
            priority
            className="h-9 w-9 object-contain"
            sizes="36px"
          />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => {
            const baseClass =
              "relative text-white hover:text-gray-300 transition-colors duration-300 font-normal tracking-wide pb-1 group";

            if (isHashLink(item.href)) {
              return (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className={baseClass}
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 ease-out group-hover:w-full"></span>
                </button>
              );
            }

            if (isExternalLink(item.href)) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={baseClass}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 ease-out group-hover:w-full"></span>
                </a>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={baseClass}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 ease-out group-hover:w-full"></span>
              </Link>
            );
          })}
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
          <button
            className="absolute right-6 top-6 text-white hover:text-gray-300 transition-colors"
            onClick={() => setIsMenuOpen(false)}
            aria-label="메뉴 닫기"
          >
            <X size={28} />
          </button>
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            {navItems.map((item) => {
              const baseClass =
                "text-white text-2xl font-bold tracking-wider hover:text-gray-300 transition-colors duration-300";

              if (isHashLink(item.href)) {
                return (
                  <button
                    key={item.label}
                    onClick={() => scrollToSection(item.href)}
                    className={baseClass}
                  >
                    {item.label}
                  </button>
                );
              }

              if (isExternalLink(item.href)) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={baseClass}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={baseClass}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {showHeroContent ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 pointer-events-none md:items-start md:justify-start md:px-12 md:pt-36">
          <div
            className={`${bodyFont.className} text-center text-white max-w-lg md:max-w-[50%] md:text-left`}
          >
            {/* Main Title */}
            <HeroTypography
              as="h1"
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-wider mb-4 leading-none"
            >
              {siteContent.hero.titleLines.map((line, index) => (
                <span key={line}>
                  {line}
                  {index < siteContent.hero.titleLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </HeroTypography>

            {/* Subtitle */}
          <HeroTypography
            as="p"
            className="text-lg md:text-xl font-normal tracking-wide mb-8 text-gray-200"
          >
            <span>{siteContent.hero.subtitle}</span>
            {heroSubtitleLines.map((line) => (
              <span key={line}>
                <br />
                {line}
              </span>
            ))}
          </HeroTypography>
          </div>
        </div>
      ) : null}

      {overlay ? (
        <div className="absolute inset-0 z-10 pointer-events-auto">
          {overlay}
        </div>
      ) : null}

      {showSliderNav ? (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center space-x-4">
            {/* Slide Indicators */}
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => carouselApi?.scrollTo(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    currentSlide === index
                      ? "bg-white"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`${siteContent.hero.aria.goToSlidePrefix} ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
