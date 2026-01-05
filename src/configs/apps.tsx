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
    id: "dreamlib",
    title: "Dream📚Lib",
    desktop: true,
    width: 860,
    height: 500,
    show: true,
    y: -11,
    img: "img/icons/dreamlib.jpeg",
    content: <Bunny />
  },
  {
    id: "bunpad",
    title: "Bun📝Pad",
    desktop: true,
    width: 600,
    height: 500,
    img: "img/icons/bunpa.png", // add an icon
    content: <Notepad />
  },
  {
    id: "networx",
    title: "NETWOR✖️",
    desktop: true,
    img: "img/icons/networx42.png",
    x: -0,
    y: 20,
    content: <NetWorx />
  },
  {
    id: "particlesmask",
    title: "DEV🫎EL©PER",
    desktop: true,
    img: "img/icons/develcoper.png",
    x: -0,
    y: 20,
    content: <ParticlesMask />
  },
  {
    id: "cosmicui",
    title: "Cosmic✨UI",
    desktop: true,
    width: 960,
    height: 640,
    img: "img/icons/cosmicui.png",
    content: <CosmicUI />
  },
  {
    id: "bunnote",
    title: "Bun✍️Note",
    desktop: true,
    y: -15,
    img: "img/icons/Bbss.jpeg",
    content: <Typora />
  },
  {
    id: "beehive",
    title: "Bee♾️Hive",
    desktop: true,
    width: 1024,
    minWidth: 375,
    minHeight: 200,
    x: -20,
    img: "img/icons/beehivemind.png",
    content: <Safari />
  },
/*  {
    id: "vscode",
    title: "VSCode",
    desktop: true,
    width: 900,
    height: 600,
    x: 40,
    y: -10,
    img: "img/icons/vscode.png",
    content: <VSCode />
  },*/
  {
    id: "mirrorworld",
    title: "Mirror🪞World",
    desktop: true,
    img: "img/icons/themirrorworld.png",
    width: 500 * 1.7,
    height: 500 + appBarHeight,
    minWidth: 350 * 1.7,
    minHeight: 350 + appBarHeight,
    aspectRatio: 1.7,
    x: -40,
    y: 20,
    content: <FaceTime />
  },
/*  {
    id: "terminal",
    title: "Terminal",
    desktop: true,
    img: "img/icons/terminal.png",
    content: <Terminal />
  },*/
  //  {
  //    id: "github",
  //    title: "Github",
  //   desktop: false,
  //    img: "img/icons/github.png",
  //    link: "https://github.com/Renovamen/playground-macos"
  //  },
  {
    id: "burnithole",
    title: "Bu®n-It-H🔥le",
    desktop: true,
    img: "img/icons/burnithole.png",
    content: <Chat />
  }
];

export default apps;
