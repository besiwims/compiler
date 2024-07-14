import { $, SourceMappedString } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"

/**
 * @typedef {import("./Definitions.js").Definitions} Definitions
 */

/**
 * For top-level statements
 * TODO: rely on ir library mutual recursion handling
 * @param {SourceMappedString} mainIR
 * @param {Definitions} map
 * @returns {SourceMappedString}
 */
export function injectMutualRecursions(mainIR, map) {
    const keys = Array.from(map.keys())

    /**
     * @param {string} name
     * @param {string[]} potentialDependencies
     * @returns {string[]}
     */
    const filterMutualDependencies = (name, potentialDependencies) => {
        // names to be treated
        const stack = [name]

        /**
         * @type {Set<string>}
         */
        let set = new Set()

        while (stack.length > 0) {
            const name = expectSome(stack.shift())

            const ir = expectSome(map.get(name))

            const localDependencies = keys
                .slice(
                    keys.findIndex(
                        name.includes("[")
                            ? ((prefix) => {
                                  return (n) => n.startsWith(prefix)
                              })(name.split("[")[0])
                            : (n) => n == name
                    )
                )
                .filter((dep) => !set.has(dep))

            for (let i = 0; i < localDependencies.length; i++) {
                const dep = localDependencies[i]
                if (ir.includes(dep)) {
                    set.add(dep)

                    if (dep != name) {
                        stack.push(dep)
                    }
                }
            }
        }

        return potentialDependencies.filter((d) => set.has(d))
    }

    for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i]

        // don't make a final const statement self-recursive (makes evalParam easier)
        // don't make __helios builtins mutually recursive
        // don't make __from_data and ____<op> methods mutually recursive (used frequently inside the entrypoint)
        if (
            (k.startsWith("__const") && i == keys.length - 1) ||
            k.startsWith("__helios") ||
            k.includes("____")
        ) {
            continue
        }

        let prefix = expectSome(k.match(/(__const)?([^[]+)(\[|$)/))[0]

        // get all following definitions including self, excluding constants
        // also don't mutual recurse helios functions
        const potentialDependencies = keys
            .slice(i)
            .filter(
                (k) =>
                    (k.startsWith(prefix) ||
                        k.startsWith(`__const${prefix}`)) &&
                    !k.includes("____")
            )

        const dependencies = filterMutualDependencies(k, potentialDependencies)

        if (dependencies.length > 0) {
            const escaped = k.replace(/\[/g, "\\[").replace(/]/g, "\\]")

            const re = new RegExp(`\\b${escaped}(\\b|$)`, "gm")
            const newStr = `${k}(${dependencies.join(", ")})`
            // do the actual replacing
            for (let k_ of keys) {
                map.set(k_, expectSome(map.get(k_)).replace(re, newStr))
            }

            mainIR = mainIR.replace(re, newStr)

            const wrapped = $([
                $(`(${dependencies.join(", ")}) -> {`),
                expectSome(map.get(k)),
                $("}")
            ])

            // wrap own definition
            map.set(k, wrapped)
        }
    }

    return mainIR
}
