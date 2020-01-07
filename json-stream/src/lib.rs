extern crate serde_json as json;

use wasm_bindgen::prelude::*;

use wasm_bindgen::JsValue;

#[wasm_bindgen]
pub fn parse_json_stream(stream: &str) -> JsValue {
    let res = json::Deserializer::from_str(stream)
        .into_iter()
        .flat_map(|m| m)
        .collect::<Vec<json::Value>>();

    JsValue::from_serde(&res).unwrap()
}
