# Current profiles supported

Currently the following profiles are supported:
- [DPV-ODRL](https://w3id.org/dpv/mappings/odrl): https://github.com/w3c-cg/dpv/blob/master/mappings/odrl/dpv-odrl.ttl (NOTE: dev is used to retrieve it)
- [TOSL](https://w3id.org/tosl/): https://github.com/isa-group/tosl/blob/main/tosl.ttl

The most recent is automatically fetched using the [`FetchProfiles.ts`](../../../scripts/MakeProfiles.ts) script.
The script fetches the most recent version of the ontology and stores them in this directory.
Furthermore, the files are then prepared into a TS constant such that all profiles can be exported.


## Adding new profiles

Add an entry to the "profiles" config of the following format:

```json
{
    "profile": "tosl", // the name of the profile (will be used as file name)
    "source": "https://cdn.jsdelivr.net/gh/isa-group/tosl@main/tosl.ttl" // the link to an RDF source
}
```