import {
    choice,
} from "../decorators/model"

import app01 from "./1"
import app02 from "./2"
import app03 from "./3"
import app04 from "./4"
import app05 from "./5"
import app06 from "./6"
import app07 from "./7"
import app08 from "./8"
import app09 from "./9"
import app10 from "./10"

import {
    IApplet,
} from "./types"

export * from "./types"

export class Applets {
    @choice({
        choices: new Map([
            [app01, "app01"],
            [app02, "app02"],
            [app03, "app03"],
            [app04, "app04"],
            [app05, "app05"],
            [app06, "app06"],
            [app07, "app07"],
            [app08, "app08"],
            [app09, "app09"],
            [app10, "app10"],
        ]),
    })
    app: IApplet = app01
}
