import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/provider/",
          "/profile/",
          "/api/",
          "/booking/",
          "/tracking/",
          "/chat/",
          "/notifications/",
        ],
      },
    ],
    sitemap: "https://kazishow.co.ke/sitemap.xml",
  };
}
