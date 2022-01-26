import * as ffi from "ffi-napi";
import * as ref from "ref-napi";
import { types } from "ref-napi";
import * as di from "ref-struct-di";
const StructType = di.default(ref);
const LONG = types.long;
const ULONG = types.ulong;
const INT = types.int;
const UINT = types.uint;
const DWORD = ULONG;
const BOOL = INT;
const HANDLE = types.uint64;
const HHOOK = HANDLE;
const HWND = HANDLE;
const HINSTANCE = HANDLE;
const WPARAM = types.uint64;
const LPARAM = types.int64;
const LRESULT = types.int64;
const HOOKPROC = "pointer";
const POINT = StructType({
  x: LONG,
  y: LONG,
});
const MSG = StructType({
  hwnd: HWND,
  message: UINT,
  wParam: WPARAM,
  lParam: LPARAM,
  time: DWORD,
  pt: POINT,
  lPrivate: DWORD,
});
const KEYB = StructType({
  vkCode: DWORD,
  scanCode: DWORD,
  flags: DWORD,
  time: DWORD,
  dwExtraInfo: ULONG,
});

/* User32 bindings */

const u32 = ffi.Library("user32", {
  SetWindowsHookExW: [HHOOK, [INT, HOOKPROC, HINSTANCE, DWORD]],
  UnhookWindowsHookEx: [BOOL, [HHOOK]],
  CallNextHookEx: [LRESULT, [HHOOK, INT, WPARAM, LPARAM]],
  GetMessageW: [BOOL, [MSG, HWND, UINT, UINT]],
  TranslateMessage: [BOOL, [MSG]],
  DispatchMessageW: [LRESULT, [MSG]],
});

/* Some wrappers for them next */

function SetWindowsHookEx(idHook, lpfn, hmod, dwThreadId) {
  const callback = ffi.Callback(LRESULT, [INT, WPARAM, KEYB], lpfn);
  return u32.SetWindowsHookExW(idHook, callback, hmod, dwThreadId);
}

function UnhookWindowsHookEx(hhk) {
  return u32.UnhookWindowsHookEx(hhk);
}

function CallNextHookEx(hhk, nCode, wParam, lParam) {
  return u32.CallNextHookEx(hhk, nCode, wParam, lParam);
}

function GetMessageW(lpMsg, hWnd, wMsgFilterMin, wMsgFilterMax) {
  return u32.GetMessageW(lpMsg, hWnd, wMsgFilterMin, wMsgFilterMax);
}

function TranslateMessage(lpMsg) {
  return u32.TranslateMessage(lpMsg);
}

function DispatchMessageW(lpMsg) {
  return u32.DispatchMessageW(lpMsg);
}

/* Necessary consts */

const WM_LBUTTONDOWN = 0x0201;
const WM_LBUTTONUP = 0x0202;
const WM_KEYDOWN = 0x0100;
const WH_MOUSE_LL = 14;
const WH_KEYBOARD_LL = 13;
let hHook = 0;

/* Callback for our low level hook */

function MouseHookCallback(nCode, wParam, lParam) {
  if (nCode >= 0) {
    if (wParam === WM_LBUTTONDOWN) {
      console.log("Left Button Down");
    } else if (wParam === WM_LBUTTONUP) {
      console.log("Left Button Up");
    }
  }
  return CallNextHookEx(hHook, nCode, wParam, lParam);
}

function KeybHookCallback(nCode, wParam, lParam) {
  if (nCode >= 0) {
    if (wParam === WM_KEYDOWN) {
      console.log(String.fromCharCode(lParam.vkCode));
    }
  }
  return CallNextHookEx(hHook, nCode, wParam, lParam.ref().address());
}

//hHook = SetWindowsHookEx(WH_MOUSE_LL, MouseHookCallback, 0, 0);
hHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeybHookCallback, 0, 0);
let msg = new MSG();
while (GetMessageW(msg.ref(), 0, 0, 0)) {
  TranslateMessage(msg.ref());
  DispatchMessageW(msg.ref());
}
