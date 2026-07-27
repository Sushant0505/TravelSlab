import Link from "next/link";
import { Plane, Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
              <Plane className="h-5 w-5" />
            </span>
            <span className="text-xl font-display font-bold">
              Trip<span className="text-gradient">Slab</span>
            </span>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            India&apos;s premium travel lead marketplace. Travelers plan freely;
            verified agencies compete to craft the perfect trip.
          </p>
          <div className="flex gap-3 pt-2">
            {[Instagram, Twitter, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-primary hover:text-white"
                aria-label="social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol
          title="Explore"
          links={[
            ["Destinations", "/#destinations"],
            ["Curated Trips", "/#showcase"],
            ["Plan a Trip", "/plan"],
            ["Reviews", "/#reviews"],
          ]}
        />
        <FooterCol
          title="For Agencies"
          links={[
            ["Lead Marketplace", "/agencies"],
            ["Pricing", "/agencies/pricing"],
            ["Register Agency", "/agencies/register"],
            ["Agency Login", "/agencies/login"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["About", "/about"],
            ["Contact", "/contact"],
            ["Privacy", "/privacy"],
            ["Terms", "/terms"],
          ]}
        />
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TripSlab. All rights reserved. Built for
        travelers &amp; agencies.
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2.5 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="transition-colors hover:text-primary">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
