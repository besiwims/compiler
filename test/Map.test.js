import { describe, it } from "node:test"
import {
    True,
    map,
    int,
    False,
    list,
    compileForRun,
    bytes,
    constr,
    str,
    assertOptimizedAs
} from "./utils.js"

describe("Map", () => {
    describe("Map[Int]Int == Map[Int]Int", () => {
        const runner = compileForRun(`testing map_eq
        func main(a: Map[Int]Int, b: Map[Int]Int) -> Bool {
            a == b
        }`)

        it("{1: 1} == {1: 1} is true", () => {
            runner([map([[int(1), int(1)]]), map([[int(1), int(1)]])], True)
        })

        it("{1: 1} == {1: 2} is false", () => {
            runner([map([[int(1), int(1)]]), map([[int(1), int(2)]])], False)
        })
    })

    describe("Map[Int]Int.all_keys", () => {
        const runner = compileForRun(`testing map_all_keys_gt
        func main(a: Map[Int]Int, gt: Int) -> Bool {
            a.all_keys((k: Int) -> {k > gt})
        }`)

        it("all_keys of {1: 1, 2: 2} > 2 is false", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)]
                    ]),
                    int(2)
                ],
                False
            )
        })

        it("all_keys of {1: 1, 2: 2} > 0 is true", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)]
                    ]),
                    int(0)
                ],
                True
            )
        })
    })

    describe("Map[Int]Int.all_values", () => {
        const runner = compileForRun(`testing map_all_values_gt
        func main(a: Map[Int]Int, gt: Int) -> Bool {
            a.all_values((v: Int) -> {v > gt})
        }`)

        it("all_values of {1: 1, 2: 2} > 2 is false", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)]
                    ]),
                    int(2)
                ],
                False
            )
        })

        it("all_values of {1: 1, 2: 2} > 0 is true", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)]
                    ]),
                    int(0)
                ],
                True
            )
        })
    })

    describe("Map[Int]Int.any_key", () => {
        const runner = compileForRun(`testing map_any_key_equal
        func main(a: Map[Int]Int, k: Int) -> Bool {
            a.any_key((k_: Int) -> {k_ == k})
        }`)

        it("any_key of {1: 1, 2: 2} is 3 is false", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)]
                    ]),
                    int(3)
                ],
                False
            )
        })

        it("any_key of {1: 1, 2: 2, 3: 3} is 3 is true", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)],
                        [int(3), int(3)]
                    ]),
                    int(3)
                ],
                True
            )
        })
    })

    describe("Map[Int]Int.any_value", () => {
        const runner = compileForRun(`testing map_any_value_equal
        func main(a: Map[Int]Int, k: Int) -> Bool {
            a.any_value((k_: Int) -> {k_ == k})
        }`)

        it("any_value of {1: 1, 2: 2} is 3 is false", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)]
                    ]),
                    int(3)
                ],
                False
            )
        })

        it("any_value of {1: 1, 2: 2, 3: 3} is 3 is true", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)],
                        [int(3), int(3)]
                    ]),
                    int(3)
                ],
                True
            )
        })
    })

    describe("Map[Int]String.to_list[String]", () => {
        const runner = compileForRun(`
        testing map_to_list
        func main(a: Map[Int]Int) -> []String {
            a.to_list[String](
                (_x: Int, y: Int) -> String {"hi:"+y.show()}
            )
        }`)

        it("maps the entries to a list", () => {
            runner(
                [
                    map([
                        [int(1), int(10)],
                        [int(2), int(20)]
                    ])
                ],
                list(str("hi:10"), str("hi:20"))
            )
        })
    })

    describe("Map[Int]Int.fold_with_list", () => {
        const runner = compileForRun(`testing map_fold_with_list
        func main(a: Map[Int]Int, z0: Int, b: []Int) -> Int {
            a.fold_with_list((z: Int, key: Int, value: Int, item: Int) -> {
                z + (key + value)*item
            }, z0, b)
        }`)

        it("fold_with_list throws an error if the list is shorter", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)],
                        [int(3), int(3)]
                    ]),
                    int(0),
                    list(int(1), int(1))
                ],
                { error: "" }
            )
        })

        it("fold_with_list correctly sums", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)],
                        [int(3), int(3)]
                    ]),
                    int(0),
                    list(int(1), int(1), int(1))
                ],
                int(12)
            )
        })

        it("fold_with_list correctly sums even if list is too long", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)],
                        [int(3), int(3)]
                    ]),
                    int(0),
                    list(int(1), int(1), int(1), int(1))
                ],
                int(12)
            )
        })
    })

    describe("Map[Int]Int.fold2", () => {
        const runner = compileForRun(`testing map_fold2
        func main(a: Map[Int]Int) -> Int {
            (ks, vs) = a.fold2((ks: Int, vs: Int, key: Int, value: Int) -> {
                (ks + key, vs + value)
            }, 0, 0);
    
            ks*vs
        }`)

        it("fold2 can correctly sums keys and values separately", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)],
                        [int(3), int(3)]
                    ])
                ],
                int(36)
            )
        })

        it("fold2 can correctly sums keys and values separately with single entry", () => {
            runner([map([[int(1), int(1)]])], int(1))
        })

        it("fold2 can correctly sums keys and values separately with no entries", () => {
            runner([map([])], int(0))
        })
    })

    describe("Map[Int]Int::is_valid_data", () => {
        const runner = compileForRun(`testing map_is_valid_data
        func main(data: Data) -> Bool {
            Map[Int]Int::is_valid_data(data)
        }`)

        it("returns true for empty map", () => {
            runner([map([])], True)
        })

        it("returns true for map with 1 entry", () => {
            runner([map([[int(0), int(0)]])], True)
        })

        it("returns false for map with one bData value", () => {
            runner([map([[int(0), bytes("")]])], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for constrData", () => {
            runner([constr(123)], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })
    })

    describe("Map[Int]Int.append", () => {
        const runner = compileForRun(`testing map_append
        func main(m: Map[Int]Int, k: Int, v: Int) -> Map[Int]Int {
            m.append(k, v)
        }`)

        it("ok for empty map", () => {
            runner([map([]), int(0), int(0)], map([[int(0), int(0)]]))
        })

        it("ok for map with one entry", () => {
            runner(
                [map([[int(0), int(0)]]), int(1), int(1)],
                map([
                    [int(0), int(0)],
                    [int(1), int(1)]
                ])
            )
        })
    })

    describe("Map[Int]Int.show", () => {
        const runner = compileForRun(`testing map_show
            func main(m: Map[Int]Int) -> String {
                m.show()
            }`)

        it('{} shows as "{}"', () => {
            runner([map([])], str("{}"))
        })

        it('{1:1} shows as "{1:1}"', () => {
            runner([map([[int(1), int(1)]])], str("{1:1}"))
        })

        it('{1:1,2:2} shows as "{1:1,2:2}"', () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)]
                    ])
                ],
                str("{1:1,2:2}")
            )
        })

        it('{1:1,2:2,3:3} shows as "{1:1,2:2,3:3}"', () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)],
                        [int(3), int(3)]
                    ])
                ],
                str("{1:1,2:2,3:3}")
            )
        })

        it('{1:1,2:2,3:ConstrData(3, [])} shows as "{1:1,2:2,3:3{}}" (wrong structure, but can\'t fail)', () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)],
                        [int(3), constr(3)]
                    ])
                ],
                str("{1:1,2:2,3:3{}}")
            )
        })

        it("is optimized out in print", () => {
            assertOptimizedAs(
                `testing map_show_in_print_actual
                func main(map: Map[Int]Int) -> () {
                    print(map.show())
                }`,
                `testing map_show_in_print_expected_optimized
                func main(_: Map[Int]Int) -> () {
                    ()
                }`
            )
        })
    })
})
