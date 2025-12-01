import React, { useState } from "react";
import { wallpapers } from "~/configs";
import users from "~/configs/users"; // <-- NEW MULTI-USER FILE
import { useStore } from "~/stores";
import type { MacActions } from "~/types";

export default function Login(props: MacActions) {
  const [password, setPassword] = useState("");
  const [sign, setSign] = useState("Click to enter");

  const [selectedUser, setSelectedUser] = useState(users[0]); // default user

  const dark = useStore((state) => state.dark);

  const keyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") loginHandle();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const loginHandle = () => {
    // Cheat login (your original feature)
    if (password === "42") {
      props.setLogin(true);
      props.setAppOpen("networx", true);
      return;
    }

    // Multi-user login
    if (password === selectedUser.password) {
      props.setLogin(true);
      return;
    }

    // Wrong password
    setSign("II0");
  };

  return (
    <div
      className="size-full login text-center"
      style={{
        background: `url(${dark ? wallpapers.night : wallpapers.day}) center/cover no-repeat`
      }}
      onClick={() => loginHandle()}
    >
      <div className="inline-block w-auto relative top-1/2 -mt-40">

        {/* Avatar */}
        <img
          className="rounded-full size-24 my-0 mx-auto"
          src={selectedUser.avatar}
          alt="avatar"
        />

        <div className="font-semibold mt-2 text-xl text-white">
          {selectedUser.name}
        </div>

              {/* User selector */}
        <select
          className="mb-4 px-2 py-1 rounded bg-black/40 text-white text-sm backdrop-blur-lg"
          value={selectedUser.name}
          onChange={(e) => {
            const u = users.find((u) => u.name === e.target.value);
            if (u) setSelectedUser(u);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {users.map((u) => (
            <option key={u.name} value={u.name}>
              {u.name}
            </option>
          ))}
        </select>

        {/* Password Input */}
        <div className="mx-auto grid grid-cols-5 w-44 h-8 mt-4 rounded-md backdrop-blur-2xl bg-gray-300/50">
          <input
            className="text-sm text-white col-start-1 col-span-4 no-outline bg-transparent px-2"
            type="password"
            placeholder="Ent Password"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={keyPress}
            value={password}
            onChange={handleInputChange}
          />
          <div className="col-start-5 col-span-1 flex-center">
            <span className="i-bi:question-square-fill text-white ml-1" />
          </div>
        </div>

        <div mt-4 cursor-pointer text="sm gray-200">
          {sign}
        </div>
      </div>

      {/* Buttons */}
      <div className="text-sm fixed bottom-16 inset-x-0 mx-auto flex flex-row space-x-4 w-max">
        <div
          className="hstack flex-col text-white w-24 cursor-pointer"
          onClick={(e) => props.sleepMac(e)}
        >
          <div className="flex-center size-10 bg-gray-700 rounded-full">
            <span className="i-gg:sleep text-[40px]" />
          </div>
          <span>Sleep</span>
        </div>

        <div
          className="hstack flex-col text-white w-24 cursor-pointer"
          onClick={(e) => props.restartMac(e)}
        >
          <div className="flex-center size-10 bg-gray-700 rounded-full">
            <span className="i-ri:restart-line text-4xl" />
          </div>
          <span>Restart</span>
        </div>

        <div
          className="hstack flex-col text-white w-24 cursor-pointer"
          onClick={(e) => props.shutMac(e)}
        >
          <div className="flex-center size-10 bg-gray-700 rounded-full">
            <span className="i-ri:shut-down-line text-4xl" />
          </div>
          <span>Shut Down</span>
        </div>
      </div>
    </div>
  );
}
