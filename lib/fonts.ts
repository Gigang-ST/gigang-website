import localFont from "next/font/local"

export const bodyFont = localFont({
  src: [
    {
      path: "../app/fonts/nanum-myeongjo/NanumMyeongjo-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../app/fonts/nanum-myeongjo/NanumMyeongjo-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../app/fonts/nanum-myeongjo/NanumMyeongjo-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  display: "swap",
})
