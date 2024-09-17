import { describe, it } from "node:test"
import {
    False,
    True,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map
} from "./utils.js"

describe("Time", () => {
    describe("Time::is_valid_data", () => {
        const runner = compileForRun(`testing time_is_valid_data
        func main(data: Data) -> Bool {
            Time::is_valid_data(data)
        }`)

        it("returns true for int", () => {
            runner([int(0)], True)
        })

        it("returns false for bytes", () => {
            runner([bytes("")], False)
        })

        it("returns false for list", () => {
            runner([list()], False)
        })

        it("returns false for constr", () => {
            runner([constr(0)], False)
        })

        it("returns false for map", () => {
            runner([map([])], False)
        })
    })
})
