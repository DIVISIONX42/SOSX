import React, { useState, useEffect } from "react";
import { wallpapers } from "~/configs";
import users from "~/configs/users"; // <-- NEW MULTI-USER FILE
import { useStore } from "~/stores";
import type { MacActions } from "~/types";

export default function Login(props: MacActions) {
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const [password, setPassword] = useState("");
  const [sign, setSign] = useState("Click to enter");

  const [selectedUser, setSelectedUser] = useState(users[0]); // default user
  const setCurrentUser = useStore((s) => s.setCurrentUser);
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
      return;
    }

    const setCurrentUser = useStore((s) => s.setCurrentUser);

    if (password === selectedUser.password) {
      setCurrentUser(selectedUser);
      props.setLogin(true);
      return;
    }

    // Wrong password
    setSign("II0");
  };

  // Auto-select user and/or auto-login
  useEffect(() => {
    // Pick default user (e.g., first user)
    const defaultUser = users[0];
    setSelectedUser(defaultUser);

    // Optional: auto-fill password for that user
    //  setPassword(defaultUser.password);

    // Optional: auto-trigger login
    // loginHandle(); // <-- uncomment if you want immediate login on load
  }, []);

  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

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
          className="rounded-full size-42 my-0 mx-auto neon-red-orange"
          src={selectedUser.avatar}
          alt="avatar"
        />

        {/* User selector */}

        <div className="font-semibold w-7 h-7  items-center justify-self-center justify-center flex self-center text-center  mt-2 text-xl text-white border-purple bg-blue/33 backdrop-blur-4 border-2 rounded-3 relative font-mono text-2xl font-normal leading-tight neon-ice-blue">
          {selectedUser.name}
        </div>

        <select
          ref={selectRef}
          className="m-4.2 w-13 h-13 rounded-full items-center justify-self-center justify-center flex self-center text-center text-2xl p-0 bg-orange/23 text-white text-sm backdrop-blur-4 border-1 border-orange shadow-lg ring-0 focus:outline-none transition-transform transform hover:scale-105 active:scale-95"
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

        <div mt-2 cursor-pointer text="sm gray-200">
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
