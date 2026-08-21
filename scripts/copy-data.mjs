#!/usr/bin/env node
import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.join(root, "dist", "data");
await mkdir(dest, { recursive: true });
await cp(path.join(root, "data"), dest, { recursive: true });
console.log("Copied data/ → dist/data/");
