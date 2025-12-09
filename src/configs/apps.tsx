import { appBarHeight } from "~/utils";
import type { AppsData } from "~/types";
import CosmicUI from "~/components/apps/CosmicUI";

const apps: AppsData[] = [
  {
    id: "launchpad",
    title: "Launchpad",
    desktop: false,
    img: "img/icons/launchpad.png"
  },
  {
    id: "bunny",
    title: "BurningXBunny",
    desktop: true,
    width: 860,
    height: 500,
    show: true,
    y: -11,
    img: "img/icons/bunny.png",
    content: <Bunny />
  },
  {
    id: "notepad",
    title: "BunPa",
    desktop: true,
    width: 600,
    height: 500,
    img: "img/icons/bunpa.png", // add an icon
    content: <Notepad />
  },
  {
    id: "networx",
    title: "NETWORX",
    desktop: true,
    img: "img/icons/networx42.png",
    x: -0,
    y: 20,
    content: <NetWorx />
  },
  {
    id: "cosmicui",
    title: "CosmicUI",
    desktop: true,
    width: 960,
    height: 640,
    img: "img/icons/typora.png",
    content: <CosmicUI />
  },
  {
    id: "typora",
    title: "BunNote",
    desktop: true,
    y: -15,
    img: "img/icons/typora.png",
    content: <Typora />
  },
  {
    id: "safari",
    title: "Safari",
    desktop: true,
    width: 1024,
    minWidth: 375,
    minHeight: 200,
    x: -20,
    img: "img/icons/safari.png",
    content: <Safari />
  },
  {
    id: "vscode",
    title: "VSCode",
    desktop: true,
    width: 900,
    height: 600,
    x: 40,
    y: -10,
    img: "img/icons/vscode.png",
    content: <VSCode />
  },
  {
    id: "facetime",
    title: "FaceTime",
    desktop: true,
    img: "img/icons/facetime.png",
    width: 500 * 1.7,
    height: 500 + appBarHeight,
    minWidth: 350 * 1.7,
    minHeight: 350 + appBarHeight,
    aspectRatio: 1.7,
    x: -40,
    y: 20,
    content: <FaceTime />
  },
  {
    id: "terminal",
    title: "Terminal",
    desktop: true,
    img: "img/icons/terminal.png",
    content: <Terminal />
  },
  //  {
  //    id: "github",
  //    title: "Github",
  //   desktop: false,
  //    img: "img/icons/github.png",
  //    link: "https://github.com/Renovamen/playground-macos"
  //  },
  {
    id: "chat",
    title: "Chat",
    desktop: true,
    img: "img/icons/github.png",
    content: <Chat />
  }
];

export default apps;
