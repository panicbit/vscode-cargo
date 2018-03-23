#![feature(proc_macro)]

#[macro_use]
extern crate serde_derive;
extern crate serde_json as json;
#[macro_use]
extern crate stdweb;

use stdweb::js_export;

#[derive(Deserialize, Serialize)]
struct Value(json::Value);

js_serializable!(Value);

#[js_export]
fn parse_json_stream(stream: &str) -> Value {
    let res = json::Deserializer::from_str(stream)
        .into_iter()
        .flat_map(|m| m)
        .collect::<Vec<json::Value>>();

    Value(res.into())
}
