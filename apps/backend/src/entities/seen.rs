//! `SeaORM` Entity. Generated by sea-orm-codegen 0.11.2

use async_graphql::SimpleObject;
use async_trait::async_trait;
use chrono::NaiveDate;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::utils::associate_user_with_metadata;

use super::utils::{SeenExtraInformation, SeenPodcastExtraInformation, SeenShowExtraInformation};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize, SimpleObject)]
#[graphql(name = "Seen")]
#[sea_orm(table_name = "seen")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub progress: i32,
    pub started_on: Option<NaiveDate>,
    pub finished_on: Option<NaiveDate>,
    pub last_updated_on: DateTimeUtc,
    pub user_id: i32,
    pub metadata_id: i32,
    #[graphql(skip)]
    pub extra_information: Option<SeenExtraInformation>,
    #[sea_orm(ignore)]
    pub show_information: Option<SeenShowExtraInformation>,
    #[sea_orm(ignore)]
    pub podcast_information: Option<SeenPodcastExtraInformation>,
    #[graphql(skip)]
    pub identifier: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::metadata::Entity",
        from = "Column::MetadataId",
        to = "super::metadata::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Metadata,
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    User,
}

impl Related<super::metadata::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Metadata.def()
    }
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

#[async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn after_save<C>(model: Model, db: &C, insert: bool) -> Result<Model, DbErr>
    where
        C: ConnectionTrait,
    {
        if insert {
            associate_user_with_metadata(&model.user_id, &model.metadata_id, db)
                .await
                .ok();
        }
        Ok(model)
    }
}
