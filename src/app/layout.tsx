import type { Metadata,Viewport } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/config";
import { PwaBootstrap } from "@/components/pwa-client";
export const viewport:Viewport={themeColor:"#177245"};
export const metadata:Metadata={title:{default:APP_NAME,template:`%s · ${APP_NAME}`},description:"Rental and property management for modern landlords.",manifest:"/manifest.webmanifest",appleWebApp:{capable:true,statusBarStyle:"default",title:APP_NAME},icons:{icon:[{url:"/icons/icon-192.png",sizes:"192x192",type:"image/png"},{url:"/icons/icon-512.png",sizes:"512x512",type:"image/png"}],apple:"/icons/icon-192.png"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><PwaBootstrap/>{children}</body></html>}
