import type {Metadata} from "next";import "./globals.css";
export const metadata:Metadata={title:"Sting Trophy Club Boys",description:"The home of Sting Trophy Club U17 and U16 boys soccer."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
