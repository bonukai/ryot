import type { NextPageWithLayout } from "../_app";
import useUser from "@/lib/hooks/useUser";
import LoadingPage from "@/lib/layouts/LoadingPage";
import LoggedIn from "@/lib/layouts/LoggedIn";
import { gqlClient } from "@/lib/services/api";
import {
	Verb,
	changeCase,
	getInitials,
	getStringAsciiValue,
	getVerb,
} from "@/lib/utilities";
import { Carousel } from "@mantine/carousel";
import {
	Accordion,
	ActionIcon,
	Alert,
	Anchor,
	Avatar,
	Badge,
	Box,
	Button,
	Collapse,
	Container,
	Flex,
	Group,
	Image,
	Indicator,
	type MantineGradient,
	Modal,
	Rating,
	ScrollArea,
	Select,
	SimpleGrid,
	Slider,
	Space,
	Stack,
	Tabs,
	Text,
	Title,
	useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
	AddMediaToCollectionDocument,
	type AddMediaToCollectionMutationVariables,
	CollectionsDocument,
	type CollectionsQuery,
	CommitNext10PodcastEpisodesDocument,
	type CommitNext10PodcastEpisodesMutationVariables,
	CreateCollectionDocument,
	type CreateCollectionMutationVariables,
	DeleteSeenItemDocument,
	type DeleteSeenItemMutationVariables,
	DeployUpdateMetadataJobDocument,
	type DeployUpdateMetadataJobMutationVariables,
	MediaDetailsDocument,
	MediaItemReviewsDocument,
	type MediaItemReviewsQuery,
	MetadataLot,
	ProgressUpdateAction,
	ProgressUpdateDocument,
	type ProgressUpdateMutationVariables,
	SeenHistoryDocument,
} from "@ryot/generated/graphql/backend/graphql";
import {
	IconAlertCircle,
	IconEdit,
	IconInfoCircle,
	IconMessageCircle2,
	IconPlayerPlay,
	IconRotateClockwise,
	IconUser,
	IconX,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactElement, useState } from "react";
import ReactMarkdown from "react-markdown";
import invariant from "tiny-invariant";
import { match } from "ts-pattern";

const StatDisplay = (props: { name: string; value: string }) => {
	return (
		<Flex>
			<Text fw="bold">{props.name}:</Text>
			<Text truncate ml={"xs"}>
				{props.value}
			</Text>
		</Flex>
	);
};

function ProgressModal(props: {
	opened: boolean;
	onClose: () => void;
	metadataId: number;
	progress: number;
	refetch: () => void;
}) {
	const [value, setValue] = useState(props.progress);
	const progressUpdate = useMutation({
		mutationFn: async (variables: ProgressUpdateMutationVariables) => {
			const { progressUpdate } = await gqlClient.request(
				ProgressUpdateDocument,
				variables,
			);
			return progressUpdate;
		},
		onSuccess: () => {
			props.refetch();
			props.onClose();
		},
	});

	return (
		<Modal
			opened={props.opened}
			onClose={props.onClose}
			withCloseButton={false}
			centered
		>
			<Stack>
				<Title order={3}>Set progress</Title>
				<Slider showLabelOnHover={false} value={value} onChange={setValue} />
				<Button
					variant="outline"
					onClick={async () => {
						await progressUpdate.mutateAsync({
							input: {
								action: ProgressUpdateAction.Update,
								progress: value,
								metadataId: props.metadataId,
							},
						});
					}}
				>
					Set
				</Button>
				<Button variant="outline" color="red" onClick={props.onClose}>
					Cancel
				</Button>
			</Stack>
		</Modal>
	);
}

function SelectCollectionModal(props: {
	opened: boolean;
	onClose: () => void;
	metadataId: number;
	refetchCollections: () => void;
	collections: CollectionsQuery["collections"];
}) {
	const [selectedCollection, setSelectedCollection] = useState<string | null>(
		null,
	);

	const createCollection = useMutation({
		mutationFn: async (variables: CreateCollectionMutationVariables) => {
			const { createCollection } = await gqlClient.request(
				CreateCollectionDocument,
				variables,
			);
			return createCollection;
		},
		onSuccess: () => {
			props.refetchCollections();
		},
	});
	const addMediaToCollection = useMutation({
		mutationFn: async (variables: AddMediaToCollectionMutationVariables) => {
			const { addMediaToCollection } = await gqlClient.request(
				AddMediaToCollectionDocument,
				variables,
			);
			return addMediaToCollection;
		},
		onSuccess: () => {
			props.refetchCollections();
			props.onClose();
		},
	});

	return (
		<Modal
			opened={props.opened}
			onClose={props.onClose}
			withCloseButton={false}
			centered
		>
			{props.collections ? (
				<Stack>
					<Title order={3}>Select collection</Title>
					<Select
						withinPortal
						data={props.collections.map((c) => c.collectionDetails.name)}
						onChange={setSelectedCollection}
						searchable
						nothingFound="Nothing found"
						creatable
						getCreateLabel={(query) => `+ Create ${query}`}
						onCreate={(query) => {
							createCollection.mutate({ input: { name: query } });
							return { value: "1", label: query }; // technically this should return the id of the new collection but it works fine
						}}
					/>
					<Button
						data-autofocus
						variant="outline"
						onClick={() => {
							addMediaToCollection.mutate({
								input: {
									collectionName: selectedCollection || "",
									mediaId: props.metadataId,
								},
							});
						}}
					>
						Set
					</Button>
					<Button variant="outline" color="red" onClick={props.onClose}>
						Cancel
					</Button>
				</Stack>
			) : null}
		</Modal>
	);
}

const AccordionLabel = ({
	name,
	posterImages,
	overview,
	children,
	displayIndicator,
}: {
	name: string;
	posterImages: string[];
	overview?: string | null;
	children: JSX.Element;
	displayIndicator: number;
}) => {
	return (
		<Box>
			<Flex align={"center"} gap="sm">
				<Indicator
					disabled={displayIndicator === 0}
					label={displayIndicator === 1 ? "Seen" : `Seen X${displayIndicator}`}
					offset={7}
					position="bottom-end"
					size={16}
					color="red"
				>
					<Avatar src={posterImages[0]} radius="xl" size="lg" />
				</Indicator>
				{children}
			</Flex>
			<Space h="xs" />
			<Text>{name}</Text>
			{overview ? (
				<Text
					size="sm"
					color="dimmed"
					dangerouslySetInnerHTML={{ __html: overview }}
				/>
			) : null}
		</Box>
	);
};

const ReviewItem = ({
	r,
	metadataId,
}: {
	r: MediaItemReviewsQuery["mediaItemReviews"][number];
	metadataId: number;
}) => {
	const [opened, { toggle }] = useDisclosure(false);
	const user = useUser();

	return (
		<Box key={r.id}>
			<Flex align={"center"} gap={"sm"}>
				<Avatar color="cyan" radius="xl">
					{getInitials(r.postedBy.name)}{" "}
				</Avatar>
				<Box>
					<Text>{r.postedBy.name}</Text>
					<Text>{DateTime.fromJSDate(r.postedOn).toLocaleString()}</Text>
				</Box>
				{user && user.id === r.postedBy.id ? (
					<Link
						href={`/media/post-review?item=${metadataId}&reviewId=${r.id}`}
						passHref
						legacyBehavior
					>
						<Anchor>
							<ActionIcon>
								<IconEdit size="1rem" />
							</ActionIcon>
						</Anchor>
					</Link>
				) : null}
			</Flex>
			<Box ml={"sm"} mt={"xs"}>
				{r.rating ? (
					<Rating value={Number(r.rating)} fractions={2} readOnly />
				) : null}
				<Space h="xs" />
				{r.text ? (
					!r.spoiler ? (
						<ReactMarkdown>{r.text}</ReactMarkdown>
					) : (
						<>
							{!opened ? (
								<Button onClick={toggle} variant={"subtle"} compact>
									Show spoiler
								</Button>
							) : null}
							<Collapse in={opened}>
								<ReactMarkdown>{r.text}</ReactMarkdown>
							</Collapse>
						</>
					)
				) : null}
			</Box>
		</Box>
	);
};

const Page: NextPageWithLayout = () => {
	const [
		progressModalOpened,
		{ open: progressModalOpen, close: progressModalClose },
	] = useDisclosure(false);
	const [
		collectionModalOpened,
		{ open: collectionModalOpen, close: collectionModalClose },
	] = useDisclosure(false);
	const router = useRouter();
	const metadataId = parseInt(router.query.item?.toString() || "0");
	const theme = useMantineTheme();
	const colors = Object.keys(theme.colors);

	const mediaDetails = useQuery({
		queryKey: ["details", metadataId],
		queryFn: async () => {
			const { mediaDetails } = await gqlClient.request(MediaDetailsDocument, {
				metadataId: metadataId,
			});
			return mediaDetails;
		},
	});
	const seenHistory = useQuery({
		queryKey: ["history", metadataId, mediaDetails.data?.type],
		queryFn: async () => {
			const { seenHistory } = await gqlClient.request(SeenHistoryDocument, {
				metadataId: metadataId,
				isShow: mediaDetails.data?.type === MetadataLot.Show,
			});
			return seenHistory;
		},
	});
	const collections = useQuery({
		queryKey: ["collections"],
		queryFn: async () => {
			const { collections } = await gqlClient.request(CollectionsDocument, {});
			return collections;
		},
	});
	const reviews = useQuery({
		queryKey: ["reviews", metadataId],
		queryFn: async () => {
			const { mediaItemReviews } = await gqlClient.request(
				MediaItemReviewsDocument,
				{
					metadataId: metadataId,
				},
			);
			return mediaItemReviews;
		},
		staleTime: Infinity,
	});
	const progressUpdate = useMutation({
		mutationFn: async (variables: ProgressUpdateMutationVariables) => {
			const { progressUpdate } = await gqlClient.request(
				ProgressUpdateDocument,
				variables,
			);
			return progressUpdate;
		},
		onSuccess: () => {
			seenHistory.refetch();
		},
	});
	const deleteSeenItem = useMutation({
		mutationFn: async (variables: DeleteSeenItemMutationVariables) => {
			const { deleteSeenItem } = await gqlClient.request(
				DeleteSeenItemDocument,
				variables,
			);
			return deleteSeenItem;
		},
		onSuccess: () => {
			seenHistory.refetch();
			notifications.show({
				title: "Deleted",
				message: "Record deleted from your history successfully",
			});
		},
	});
	const commitNext10Episodes = useMutation({
		mutationFn: async (
			variables: CommitNext10PodcastEpisodesMutationVariables,
		) => {
			const { commitNext10PodcastEpisodes } = await gqlClient.request(
				CommitNext10PodcastEpisodesDocument,
				variables,
			);
			return commitNext10PodcastEpisodes;
		},
		onSuccess: () => {
			mediaDetails.refetch();
		},
	});
	const deployUpdateMetadataJob = useMutation({
		mutationFn: async (variables: DeployUpdateMetadataJobMutationVariables) => {
			const { deployUpdateMetadataJob } = await gqlClient.request(
				DeployUpdateMetadataJobDocument,
				variables,
			);
			return deployUpdateMetadataJob;
		},
		onSuccess: () => {
			seenHistory.refetch();
			notifications.show({
				title: "Deployed",
				message: "This record's metadata will be updated in the background.",
			});
		},
	});

	const badgeGradient: MantineGradient = match(mediaDetails.data?.type)
		.with(MetadataLot.AudioBook, () => ({ from: "indigo", to: "cyan" }))
		.with(MetadataLot.Book, () => ({ from: "teal", to: "lime" }))
		.with(MetadataLot.Movie, () => ({ from: "teal", to: "blue" }))
		.with(MetadataLot.Show, () => ({ from: "orange", to: "red" }))
		.with(MetadataLot.VideoGame, () => ({
			from: "purple",
			to: "blue",
		}))
		.with(MetadataLot.Podcast, undefined, () => ({
			from: "yellow",
			to: "purple",
		}))
		.exhaustive();

	// it is the job of the backend to ensure that this has only one item
	const inProgressSeenItem = seenHistory.data?.find((h) => h.progress < 100);

	// all the collections that the user has added this media to
	const mediaCollections = collections.data
		?.filter((c) =>
			c.mediaDetails.some((m) => m.identifier === metadataId.toString()),
		)
		.map((c) => c.collectionDetails.name);

	// the next episode if it is a show or podcast
	const nextEpisode = match(seenHistory.data?.at(0))
		.with(undefined, () => undefined)
		.otherwise((value) => {
			return match(mediaDetails.data?.type)
				.with(MetadataLot.Show, () => {
					const allEpisodes =
						mediaDetails.data?.showSpecifics?.seasons.flatMap((s) =>
							s.episodes.map((e) => ({
								seasonNumber: s.seasonNumber,
								...e,
							})),
						) || [];
					const current = allEpisodes.findIndex(
						(p) =>
							p.episodeNumber === value.showInformation?.episode &&
							p.seasonNumber === value.showInformation?.season,
					);
					invariant(typeof current === "number");
					if (current === -1) return undefined;
					const ep = allEpisodes.at(current + 1);
					if (!ep) return undefined;
					return { episode: ep.episodeNumber, season: ep.seasonNumber };
				})
				.with(MetadataLot.Podcast, () => {
					const current =
						mediaDetails.data?.podcastSpecifics?.episodes.findIndex(
							(p) => p.number === value.podcastInformation?.episode,
						);
					invariant(typeof current === "number");
					if (current === -1) return undefined;
					const ep = mediaDetails.data?.podcastSpecifics?.episodes.at(
						current + 1,
					);
					if (!ep) return undefined;
					return { episode: ep.number, season: null };
				})
				.otherwise(() => undefined);
		});

	return mediaDetails.data && seenHistory.data ? (
		<>
			<Head>
				<title>{mediaDetails.data.title} | Ryot</title>
			</Head>
			<Container>
				<Flex direction={{ base: "column", md: "row" }} gap={"lg"}>
					<Stack
						sx={(t) => ({
							width: "100%",
							flex: "none",
							[t.fn.largerThan("md")]: { width: "35%" },
						})}
					>
						<Box pos={"relative"}>
							{mediaDetails.data.posterImages.length > 0 ? (
								<Carousel
									withIndicators={mediaDetails.data.posterImages.length > 1}
									withControls={mediaDetails.data.posterImages.length > 1}
									w={300}
								>
									{[
										...mediaDetails.data.posterImages,
										...mediaDetails.data.backdropImages,
									].map((i) => (
										<Carousel.Slide key={i}>
											<Image src={i} radius={"lg"} />
										</Carousel.Slide>
									))}
								</Carousel>
							) : (
								<Box w={300}>
									<Image withPlaceholder height={400} radius={"lg"} />
								</Box>
							)}
							<Badge
								id="data-source"
								pos={"absolute"}
								size="lg"
								top={10}
								left={10}
								color="dark"
								variant="filled"
							>
								{mediaDetails.data.audioBookSpecifics?.source ||
									mediaDetails.data.bookSpecifics?.source ||
									mediaDetails.data.movieSpecifics?.source ||
									mediaDetails.data.podcastSpecifics?.source ||
									mediaDetails.data.showSpecifics?.source ||
									mediaDetails.data.videoGameSpecifics?.source ||
									"UNKNOWN"}
							</Badge>
						</Box>
						<Box>
							{mediaDetails.data.type !== MetadataLot.Show &&
							mediaDetails.data.creators.length > 0 ? (
								<StatDisplay
									name="Author(s)"
									value={mediaDetails.data.creators.join(", ")}
								/>
							) : null}
							{mediaDetails.data.genres.length > 0 ? (
								<StatDisplay
									name="Genre(s)"
									value={mediaDetails.data.genres.join(", ")}
								/>
							) : null}
							{mediaDetails.data.publishDate ? (
								<StatDisplay
									name="Published on"
									value={mediaDetails.data.publishDate.toString()}
								/>
							) : mediaDetails.data.publishYear ? (
								<StatDisplay
									name="Published in"
									value={mediaDetails.data.publishYear.toString()}
								/>
							) : null}
							{mediaDetails.data.bookSpecifics?.pages ? (
								<StatDisplay
									name="Number of pages"
									value={
										mediaDetails.data.bookSpecifics.pages?.toString() || ""
									}
								/>
							) : null}
							{mediaDetails.data.movieSpecifics?.runtime ? (
								<StatDisplay
									name="Runtime"
									value={
										`${mediaDetails.data.movieSpecifics.runtime?.toString()} minutes` ||
										""
									}
								/>
							) : null}
							{mediaDetails.data.podcastSpecifics?.totalEpisodes ? (
								<StatDisplay
									name="Total episodes"
									value={mediaDetails.data.podcastSpecifics.totalEpisodes?.toString()}
								/>
							) : null}
						</Box>
					</Stack>
					<Stack style={{ flexGrow: 1 }}>
						<Group>
							<Title underline>{mediaDetails.data.title}</Title>
							<Badge variant="gradient" gradient={badgeGradient}>
								{changeCase(mediaDetails.data.type)}
							</Badge>
						</Group>
						{mediaCollections && mediaCollections.length > 0 ? (
							<Group>
								{mediaCollections.map((c) => (
									<Badge
										key={c}
										color={
											colors[
												// taken from https://stackoverflow.com/questions/44975435/using-mod-operator-in-javascript-to-wrap-around#comment76926119_44975435
												(getStringAsciiValue(c) + colors.length) % colors.length
											]
										}
									>
										<Text truncate>{c}</Text>
									</Badge>
								))}
							</Group>
						) : null}
						{inProgressSeenItem ? (
							<Alert icon={<IconAlertCircle size="1rem" />} variant="outline">
								You are currently {getVerb(Verb.Read, mediaDetails.data.type)}
								ing this ({inProgressSeenItem.progress}%)
							</Alert>
						) : null}
						<Tabs
							defaultValue={
								seenHistory.data.length > 0 ? "actions" : "overview"
							}
							variant="outline"
						>
							<Tabs.List mb={"xs"}>
								<Tabs.Tab
									value="overview"
									icon={<IconInfoCircle size="1rem" />}
								>
									Overview
								</Tabs.Tab>
								<Tabs.Tab value="actions" icon={<IconUser size="1rem" />}>
									Actions
								</Tabs.Tab>
								<Tabs.Tab
									value="history"
									icon={<IconRotateClockwise size="1rem" />}
								>
									History
								</Tabs.Tab>
								{mediaDetails.data.showSpecifics ? (
									<Tabs.Tab
										value="seasons"
										icon={<IconPlayerPlay size="1rem" />}
									>
										Seasons
									</Tabs.Tab>
								) : null}
								{mediaDetails.data.podcastSpecifics ? (
									<Tabs.Tab
										value="episodes"
										icon={<IconPlayerPlay size="1rem" />}
									>
										Episodes
									</Tabs.Tab>
								) : null}
								<Tabs.Tab
									value="reviews"
									icon={<IconMessageCircle2 size="1rem" />}
								>
									Reviews
								</Tabs.Tab>
							</Tabs.List>
							<Tabs.Panel value="overview">
								<Box>
									{mediaDetails.data.description ? (
										<ScrollArea.Autosize mah={300}>
											<Text
												dangerouslySetInnerHTML={{
													__html: mediaDetails.data.description,
												}}
											/>
										</ScrollArea.Autosize>
									) : (
										<Text fs="italic">No overview available</Text>
									)}
								</Box>
							</Tabs.Panel>
							<Tabs.Panel value="actions">
								<SimpleGrid
									cols={1}
									spacing="lg"
									breakpoints={[{ minWidth: "md", cols: 2 }]}
								>
									{inProgressSeenItem ? (
										<>
											<Button variant="outline" onClick={progressModalOpen}>
												Set progress
											</Button>
											<ProgressModal
												progress={inProgressSeenItem.progress}
												refetch={seenHistory.refetch}
												metadataId={metadataId}
												onClose={progressModalClose}
												opened={progressModalOpened}
											/>
											<Button
												variant="outline"
												onClick={async () => {
													await progressUpdate.mutateAsync({
														input: {
															action: ProgressUpdateAction.Update,
															progress: 100,
															metadataId: metadataId,
														},
													});
												}}
											>
												I finished {getVerb(Verb.Read, mediaDetails.data.type)}
												ing it
											</Button>
										</>
									) : mediaDetails.data.type === MetadataLot.Show ||
									  mediaDetails.data.type === MetadataLot.Podcast ? (
										nextEpisode ? (
											<Button
												variant="outline"
												onClick={async () => {
													if (mediaDetails.data.type === MetadataLot.Podcast)
														router.push(
															`/media/update-progress?item=${metadataId}&selectedPodcastEpisodeNumber=${nextEpisode.episode}`,
														);
													else
														router.push(
															`/media/update-progress?item=${metadataId}&selectedShowSeasonNumber=${nextEpisode.season}&selectedShowEpisodeNumber=${nextEpisode.episode}`,
														);
												}}
											>
												Mark{" "}
												{mediaDetails.data.type === MetadataLot.Show
													? `S${nextEpisode.season}-E${nextEpisode.episode}`
													: `EP-${nextEpisode.episode}`}{" "}
												as seen
											</Button>
										) : null
									) : (
										<Button
											variant="outline"
											onClick={async () => {
												await progressUpdate.mutateAsync({
													input: {
														action: ProgressUpdateAction.JustStarted,
														metadataId: metadataId,
													},
												});
											}}
										>
											I'm {getVerb(Verb.Read, mediaDetails.data.type)}ing it
										</Button>
									)}
									<Button
										variant="outline"
										onClick={() => {
											router.push(`/media/update-progress?item=${metadataId}`);
										}}
									>
										Add to {getVerb(Verb.Read, mediaDetails.data.type)} history
									</Button>
									<Link
										href={`/media/post-review?item=${metadataId}`}
										passHref
										legacyBehavior
									>
										<Anchor>
											<Button variant="outline" w="100%">
												Post a review
											</Button>
										</Anchor>
									</Link>
									<>
										<Button variant="outline" onClick={collectionModalOpen}>
											Add to collection
										</Button>
										{collections.data ? (
											<SelectCollectionModal
												onClose={collectionModalClose}
												opened={collectionModalOpened}
												metadataId={metadataId}
												collections={collections.data}
												refetchCollections={collections.refetch}
											/>
										) : null}
									</>
									<Button
										variant="outline"
										onClick={() => {
											deployUpdateMetadataJob.mutate({ metadataId });
										}}
									>
										Update metadata
									</Button>
								</SimpleGrid>
							</Tabs.Panel>
							<Tabs.Panel value="history">
								{seenHistory.data.length > 0 ? (
									<ScrollArea.Autosize mah={300}>
										<Stack>
											<Text>
												{seenHistory.data.length} element
												{seenHistory.data.length > 1 ? "s" : ""} in history
											</Text>
											{seenHistory.data.map((h) => (
												<Flex key={h.id} direction={"column"} ml="md">
													<Flex gap="xl">
														{h.progress < 100 ? (
															<Text fw="bold">Progress {h.progress}%</Text>
														) : (
															<Text fw="bold">Completed</Text>
														)}
														{h.showInformation ? (
															<Text color="dimmed">
																S{h.showInformation.season}-E
																{h.showInformation.episode}
															</Text>
														) : null}
														{h.podcastInformation ? (
															<Text color="dimmed">
																EP-{h.podcastInformation.episode}
															</Text>
														) : null}
													</Flex>
													<Flex ml="sm" direction={"column"} gap={4}>
														<Flex gap="xl">
															<Flex gap={"xs"}>
																<Text size="sm">Started:</Text>
																<Text size="sm" fw="bold">
																	{h.startedOn
																		? DateTime.fromISO(
																				h.startedOn,
																		  ).toLocaleString()
																		: "N/A"}
																</Text>
															</Flex>
															<Flex gap={"xs"}>
																<Text size="sm">Ended:</Text>
																<Text size="sm" fw="bold">
																	{h.finishedOn
																		? DateTime.fromISO(
																				h.finishedOn,
																		  ).toLocaleString()
																		: "N/A"}
																</Text>
															</Flex>
														</Flex>
														<Flex gap={"md"}>
															<Flex gap={"xs"}>
																<Text size="sm">Updated:</Text>
																<Text size="sm" fw="bold">
																	{DateTime.fromJSDate(
																		h.lastUpdatedOn,
																	).toLocaleString()}
																</Text>
															</Flex>
															<Button
																variant="outline"
																color="red"
																leftIcon={<IconX size="1.2rem" />}
																compact
																onClick={() => {
																	deleteSeenItem.mutate({ seenId: h.id });
																}}
															>
																Delete
															</Button>
														</Flex>
													</Flex>
												</Flex>
											))}
										</Stack>
									</ScrollArea.Autosize>
								) : (
									<Text fs="italic">You have no history for this item</Text>
								)}
							</Tabs.Panel>
							{mediaDetails.data.showSpecifics ? (
								<Tabs.Panel value="seasons">
									<ScrollArea.Autosize mah={300}>
										<Accordion chevronPosition="right" variant="contained">
											{mediaDetails.data.showSpecifics.seasons.map((s) => (
												<Accordion.Item
													value={s.seasonNumber.toString()}
													key={s.seasonNumber}
												>
													<Accordion.Control>
														<AccordionLabel
															{...s}
															name={`${s.seasonNumber}. ${s.name}`}
															displayIndicator={
																s.episodes.every((e) =>
																	seenHistory.data.some(
																		(h) =>
																			h.showInformation?.episode ===
																				e.episodeNumber &&
																			h.showInformation.season ===
																				s.seasonNumber,
																	),
																)
																	? 1
																	: 0
															}
														>
															<Button
																variant="outline"
																onClick={() => {
																	router.push(
																		`/media/update-progress?item=${metadataId}&selectedShowSeasonNumber=${s.seasonNumber}&onlySeason=1`,
																	);
																}}
															>
																Mark as seen
															</Button>
														</AccordionLabel>
													</Accordion.Control>
													<Accordion.Panel>
														{s.episodes.map((e) => (
															<Box mb={"xs"} ml={"md"} key={e.id}>
																<AccordionLabel
																	{...e}
																	key={e.episodeNumber}
																	name={`${e.episodeNumber}. ${e.name}`}
																	displayIndicator={
																		seenHistory.data.filter(
																			(h) =>
																				h.showInformation?.episode ===
																					e.episodeNumber &&
																				h.showInformation.season ===
																					s.seasonNumber,
																		).length
																	}
																>
																	<Button
																		variant="outline"
																		onClick={() => {
																			router.push(
																				`/media/update-progress?item=${metadataId}&selectedShowSeasonNumber=${s.seasonNumber}&selectedShowEpisodeNumber=${e.episodeNumber}`,
																			);
																		}}
																	>
																		Mark as seen
																	</Button>
																</AccordionLabel>
															</Box>
														))}
													</Accordion.Panel>
												</Accordion.Item>
											))}
										</Accordion>
									</ScrollArea.Autosize>
								</Tabs.Panel>
							) : null}
							{mediaDetails.data.podcastSpecifics ? (
								<Tabs.Panel value="episodes">
									<ScrollArea.Autosize mah={300}>
										<Stack ml="md">
											{mediaDetails.data.podcastSpecifics.episodes.map((e) => (
												<AccordionLabel
													name={e.title}
													posterImages={[e.thumbnail || ""]}
													overview={e.overview}
													key={e.number}
													displayIndicator={
														seenHistory.data.filter(
															(h) => h.podcastInformation?.episode === e.number,
														).length
													}
												>
													<Button
														variant="outline"
														onClick={() => {
															router.push(
																`/media/update-progress?item=${metadataId}&selectedPodcastEpisodeNumber=${e.number}`,
															);
														}}
													>
														Mark as seen
													</Button>
												</AccordionLabel>
											))}
											{mediaDetails.data.podcastSpecifics.totalEpisodes >
											mediaDetails.data.podcastSpecifics.episodes.length ? (
												<Button
													onClick={() =>
														commitNext10Episodes.mutate({
															podcastId: metadataId,
														})
													}
													loading={
														commitNext10Episodes.isLoading ||
														mediaDetails.isLoading
													}
												>
													Load 10 more
												</Button>
											) : null}
										</Stack>
									</ScrollArea.Autosize>
								</Tabs.Panel>
							) : null}
							<Tabs.Panel value="reviews">
								{reviews.data && reviews.data.length > 0 ? (
									<ScrollArea.Autosize mah={300}>
										<Stack>
											{reviews.data.map((r) => (
												<ReviewItem r={r} key={r.id} metadataId={metadataId} />
											))}
										</Stack>
									</ScrollArea.Autosize>
								) : (
									<Text fs="italic">No reviews posted</Text>
								)}
							</Tabs.Panel>
						</Tabs>
					</Stack>
				</Flex>
			</Container>
		</>
	) : (
		<LoadingPage />
	);
};

Page.getLayout = (page: ReactElement) => {
	return <LoggedIn>{page}</LoggedIn>;
};

export default Page;
