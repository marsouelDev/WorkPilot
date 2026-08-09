"use client";

import { useState } from "react";
import { User, Menu, X, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const menuItems = [
    {
      label: "Accueil",
      href: "/",
    },
    {
      label: "La villa",
      href: "/villa",
    },
    {
      label: "Offres",
      href: "/offres",
    },
    {
      label: "Contact",
      href: "/contact",
    },
  ];

  return (
    <nav
      className="
        fixed
        top-0
        left-0
        z-50
        w-full
        bg-black/30
        backdrop-blur-lg
        border-b
        border-white/10
      "
    >
      <div
        className="
          mx-auto
          flex
          h-16
          max-w-7xl
          items-center
          justify-between
          px-4
          sm:px-6
        "
      >
        <Link
          href="/"
          className="
            flex
            items-center
            gap-2
            text-white
          "
        >
          <Building2 size={30} className="text-yellow-500" />

          <span
            className="
              text-xl
              font-bold
              tracking-wide
            "
          >
            Villa
          </span>
        </Link>

        <div
          className="
            hidden
            md:flex
            items-center
            gap-8
          "
        >
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="
                text-white
                transition-all
                duration-300
                hover:text-yellow-500
                hover:-translate-y-1
              "
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link
          href="/login"
          className="
            hidden
            md:flex
            items-center
            gap-2
            rounded-full
            border
            border-white/50
            px-5
            py-2
            text-white
            transition-all
            duration-300
            hover:bg-yellow-500
            hover:text-black
            hover:border-yellow-500
          "
        >
          <User size={18} />
          Connexion
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="
            md:hidden
            text-white
            hover:bg-white/10
          "
        >
          <div
            className="
              relative
              h-7
              w-7
            "
          >
            <Menu
              size={28}
              className={`
                absolute
                transition-all
                duration-300

                ${isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}

              `}
            />

            <X
              size={28}
              className={`
                absolute
                transition-all
                duration-300

                ${isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}

              `}
            />
          </div>
        </Button>
      </div>

      {/* OVERLAY MOBILE */}

      <div
        onClick={() => setIsOpen(false)}
        className={`
          fixed
          inset-0
          bg-black/50
          transition-opacity
          duration-500
          md:hidden

          ${
            isOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }

        `}
      />

      {/* MENU MOBILE */}

      <div
        className={`
          fixed
          top-16
          right-0
          h-screen
          w-72
          bg-gray-950
          text-white
          shadow-2xl

          transition-all
          duration-500
          ease-in-out

          md:hidden

          ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}

        `}
      >
        <div
          className="
            flex
            flex-col
            gap-6
            px-6
            pt-10
          "
        >
          {menuItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`

                text-lg

                transition-all
                duration-500

                hover:text-yellow-500


                ${
                  isOpen
                    ? "translate-x-0 opacity-100"
                    : "translate-x-10 opacity-0"
                }

              `}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/login"
            onClick={() => setIsOpen(false)}
            className={`

              mt-4

              flex
              items-center
              justify-center
              gap-2

              rounded-lg

              bg-yellow-500

              px-4

              py-3

              font-semibold

              text-black

              transition-all

              duration-500


              ${
                isOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }

            `}
            style={{
              transitionDelay: "500ms",
            }}
          >
            <User size={20} />
            Connexion
          </Link>
        </div>
      </div>
    </nav>
  );
}
