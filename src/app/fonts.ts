import { Fraunces, Geist, Inter, Instrument_Serif } from "next/font/google";

// Font definitions, loaded where they are used so each part of the site preloads only its own:
// the signed-in app keeps Inter and Fraunces; the public site uses Geist with Instrument Serif
// for accent words. All are self-hosted by Next.js at build time, so no font request leaves
// our server.

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz", "SOFT", "WONK"] });

export const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

/** Class names that give an element the app's fonts. */
export const appFonts = `${inter.variable} ${fraunces.variable} font-sans`;

/** Class names that give an element the public site's fonts and colours. */
export const siteFonts = `${geist.variable} ${instrumentSerif.variable} site`;
