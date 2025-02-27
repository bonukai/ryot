//! `SeaORM` Entity. Generated by sea-orm-codegen 0.11.2

use crate::{media::MetadataImages, migrator::MetadataLot};
use chrono::NaiveDate;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "metadata")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub created_on: DateTimeUtc,
    pub lot: MetadataLot,
    pub last_updated_on: DateTimeUtc,
    pub title: String,
    #[sea_orm(indexed)]
    pub identifier: String,
    pub description: Option<String>,
    pub publish_year: Option<i32>,
    pub publish_date: Option<NaiveDate>,
    pub images: MetadataImages,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_one = "super::audio_book::Entity")]
    AudioBook,
    #[sea_orm(has_one = "super::book::Entity")]
    Book,
    #[sea_orm(has_many = "super::metadata_image::Entity")]
    MetadataImage,
    #[sea_orm(has_one = "super::movie::Entity")]
    Movie,
    #[sea_orm(has_one = "super::podcast::Entity")]
    Podcast,
    #[sea_orm(has_many = "super::review::Entity")]
    Review,
    #[sea_orm(has_many = "super::seen::Entity")]
    Seen,
    #[sea_orm(has_one = "super::show::Entity")]
    Show,
    #[sea_orm(has_one = "super::video_game::Entity")]
    VideoGame,
}

impl Related<super::audio_book::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AudioBook.def()
    }
}

impl Related<super::book::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Book.def()
    }
}

impl Related<super::metadata_image::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::MetadataImage.def()
    }
}

impl Related<super::movie::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Movie.def()
    }
}

impl Related<super::podcast::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Podcast.def()
    }
}

impl Related<super::review::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Review.def()
    }
}

impl Related<super::seen::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Seen.def()
    }
}

impl Related<super::show::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Show.def()
    }
}

impl Related<super::video_game::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::VideoGame.def()
    }
}

impl Related<super::creator::Entity> for Entity {
    fn to() -> RelationDef {
        super::metadata_to_creator::Relation::Creator.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::metadata_to_creator::Relation::Metadata.def().rev())
    }
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        super::user_to_metadata::Relation::User.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::user_to_metadata::Relation::Metadata.def().rev())
    }
}

impl Related<super::genre::Entity> for Entity {
    fn to() -> RelationDef {
        super::metadata_to_genre::Relation::Genre.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::metadata_to_genre::Relation::Metadata.def().rev())
    }
}

impl Related<super::collection::Entity> for Entity {
    fn to() -> RelationDef {
        super::metadata_to_collection::Relation::Collection.def()
    }
    fn via() -> Option<RelationDef> {
        Some(
            super::metadata_to_collection::Relation::Metadata
                .def()
                .rev(),
        )
    }
}

impl ActiveModelBehavior for ActiveModel {}
