import * as path from "path"
import * as fs from "fs"
import { write } from "@jeswr/pretty-turtle"
import { Parser, Store, DataFactory } from "n3"
import { Quad } from "@rdfjs/types";

const { namedNode} = DataFactory
const profileDir = path.join(path.dirname(__filename), "..", "src", "profiles");

// initialize a profile as a ts file (constant) such that it can be used in the browser
async function profile(fileName: string, constant: string, outputName: string) {
    // parse profile
    const profile: Quad[] = [];
    const parser = new Parser()
    const profileTtl = fs.readFileSync(path.join(profileDir, "source", fileName), 'utf-8')
    // assuming ttl, yes I know there exist better parsers thanks to Ruben T
    profile.push(...parser.parse(profileTtl))
    const store = new Store(parser.parse(profileTtl))

    store.removeQuads(store.getQuads(null, namedNode("http://www.w3.org/2004/02/skos/core#note"), null, null))
    // write profile to string
    const profileTSContent = `export const ${constant}: string = String.raw\`${await write(store.getQuads(null, null, null, null), {
        prefixes: {
            cr: "https://w3id.org/force/compliance-report#",
            dct: "http://purl.org/dc/terms/",
            ex: "http://example.org/",
            foaf: "http://xmlns.com/foaf/0.1/",
            odrl: "http://www.w3.org/ns/odrl/2/",
            schema: "https://schema.org/",
            xsd: "http://www.w3.org/2001/XMLSchema#",
            dpv: "https://w3id.org/dpv#",
            sotw: "https://w3id.org/force/sotw#",
            sh: "http://www.w3.org/ns/shacl#",
            rdfs: "http://www.w3.org/2000/01/rdf-schema#",
            owl: "http://www.w3.org/2002/07/owl#",
            skos: "http://www.w3.org/2004/02/skos/core#",
            tech: "https://w3id.org/dpv/tech#",
            pd: "https://w3id.org/dpv/pd#",
            "dpv-odrl": "https://w3id.org/dpv/mappings/odrl#",
            tosl: "https://w3id.org/tosl/",
            vann: "http://purl.org/vocab/vann/",
            profile: "http://www.w3.org/ns/dx/prof/"
        }
    })}\``;

    // write profile to a ts file, this way we can use our library in the browser.
    fs.writeFileSync(path.join(profileDir, outputName), profileTSContent);
}

async function profiles() {
    await profile("dpv-odrl.ttl", "DPV_PROFILE", "DpvProfile.ts")
    await profile("tosl.ttl", "TOSL_PROFILE", "ToslProfile.ts")
}
profiles()