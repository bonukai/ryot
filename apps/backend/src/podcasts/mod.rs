use async_graphql::SimpleObject;
use sea_orm::FromJsonQueryResult;
use serde::{Deserialize, Serialize};

use crate::migrator::PodcastSource;

pub mod listennotes;
pub mod resolver;

#[derive(
    Debug, Serialize, Deserialize, SimpleObject, Clone, FromJsonQueryResult, Eq, PartialEq,
)]
pub struct PodcastSpecifics {
    pub episodes: Vec<PodcastEpisode>,
    pub source: PodcastSource,
    pub total_episodes: i32,
}

#[derive(
    Debug, PartialEq, Eq, Serialize, Deserialize, SimpleObject, Clone, FromJsonQueryResult,
)]
pub struct PodcastEpisode {
    #[serde(default)]
    pub number: i32,
    pub id: String,
    #[serde(rename = "audio_length_sec")]
    pub runtime: Option<i32>,
    #[serde(rename = "description")]
    pub overview: Option<String>,
    pub title: String,
    #[serde(rename = "pub_date_ms")]
    pub publish_date: i64,
    pub thumbnail: Option<String>,
}
