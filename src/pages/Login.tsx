// src/apps/Login.tsx
import React, { useState, useEffect } from "react";
import { wallpapers } from "~/configs";
import users from "~/configs/users";
import { useStore } from "~/stores";
import type { MacActions } from "~/types";

export default function Login(
  props: MacActions & { setCurrentUser: (user: any) => void }
) {
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const [password, setPassword] = useState("");
  const [sign, setSign] = useState("G0");
  const [selectedUser, setSelectedUser] = useState(users[0]); // default user
  const dark = useStore((state) => state.dark);

  const keyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") loginHandle();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const loginHandle = () => {
    // Cheat login (optional)
    if (password === "42" || password === selectedUser.password) {
      props.setCurrentUser(selectedUser); // save active user
      props.setLogin(true); // show Desktop
      return;
    }

    setSign("Wrong password");
  };

  useEffect(() => {
    setSelectedUser(users[0]); // default user
  }, []);

  useEffect(() => {
    selectRef.current?.focus();
  }, []);

  return (
    <div
      className="size-full login text-center"
      style={{
        background: `url(${dark ? wallpapers.night : wallpapers.day}) center/cover no-repeat`
      }}
      onClick={loginHandle}
    >
      <div className="inline-block w-auto relative top-1/4 p-8 text-center justify-center justify-items-center relative backdrop-blur-4 rounded-full neon-red-orange">
        <img
          className="rounded-full size-42 mb-2 mx-auto neon-red-orange"
          src={selectedUser.avatar}
          alt="avatar"
        />
        {/*        <div className="font-semibold w-7 h-7 flex justify-center items-center mt-2 text-xl text-white border-purple bg-blue/33 backdrop-blur-4 border-2 rounded-full font-mono text-2xl">
          {selectedUser.name}
        </div> */}

        <select
          ref={selectRef}
          className="m-4.2 w-11 h-11 rounded-full text-center bg-orange/23 text-white text-sm backdrop-blur-4 border-1 border-orange"
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

        <input
          className="text-sm text-purple col-start-1 w-[7rem] col-span-4 border-purple bg-blue/33 backdrop-blur-4 border-2 rounded-full font-mono text-2xl p-2"
          type="password"
          placeholder="AC235S C0D3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={keyPress}
          value={password}
          onChange={handleInputChange}
        />
        <div className="m-0 rounded text-center bg-yellow/23 text-white text-sm backdrop-blur-4 border-1 border-yellow p-2">
          {sign}
        </div>
      </div>
    </div>
  );
}
