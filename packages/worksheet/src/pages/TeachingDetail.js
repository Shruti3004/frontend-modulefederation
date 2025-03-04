import React from "react";
import {
  IconByName,
  Layout,
  Tab,
  classRegistryService,
  BodyLarge,
  H2,
  overrideColorTheme,
  worksheetRegistryService,
  Loading,
  telemetryFactory,
  capture,
} from "@shiksha/common-lib";
import { useTranslation } from "react-i18next";
import { Box, Button, HStack, Stack, Text, VStack } from "native-base";
import { useNavigate, useParams } from "react-router-dom";
import manifest from "../manifest.json";
import WorksheetBox from "components/WorksheetBox";
import { teachingMaterial } from "./../config/teachingMaterial";
import colorTheme from "../colorTheme";
const colors = overrideColorTheme(colorTheme);

const styles = {
  stickyButton: { boxShadow: "rgb(0 0 0 / 22%) 0px -2px 10px" },
};

export default function TeachingDetail({ footerLinks, appName }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [message, setMessage] = React.useState(true);
  const [worksheets, setWorksheets] = React.useState([]);
  const [worksheetDrafts, setWorksheetDrafts] = React.useState([]);
  const [classObject, setClassObject] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const { classId } = useParams();

  const getClass = async () => {
    const data = teachingMaterial.find((e) => e.id === classId);
    if (data) {
      setClassObject(data ? data : {});
    } else {
      let classObj = await classRegistryService.getOne({ id: classId });
      setClassObject(classObj);
    }
  };

  React.useState(async () => {
    getClass();
    const data = await worksheetRegistryService.getAll({
      limit: 2,
      state: { eq: "Publish" },
    });
    setWorksheets(data);
    const draftsData = await worksheetRegistryService.getAll({
      limit: 2,
      state: { eq: "Draft" },
    });
    setWorksheetDrafts(draftsData);
    setLoading(false);
  }, []);

  const handleExploreAllWorksheets = (state) => {
    const telemetryData = telemetryFactory.interact({
      appName,
      type: "Worksheet-Explore",
      state,
    });
    capture("INTERACT", telemetryData);
    navigate(`/worksheet/list/${state}`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Layout
      _header={{
        title: t("MY_TEACHING"),
      }}
      _appBar={{ languages: manifest.languages }}
      subHeader={`${classObject?.name ? classObject?.name : ""} ${
        classObject?.subjectName ? classObject?.subjectName : ""
      }`}
      _subHeader={{ bg: colors.cardBg }}
      _footer={footerLinks}
    >
      <VStack>
        {message ? (
          <HStack
            bg="viewNotification.600"
            p="5"
            justifyContent="space-between"
          >
            <Text textTransform="inherit">
              Choose Worksheets or Lesson Plans for the class. You can also
              create your own worksheets.
            </Text>
            <IconByName
              p="0"
              name="CloseCircleLineIcon"
              color="viewNotification.900"
              onPress={(e) => setMessage(false)}
            />
          </HStack>
        ) : (
          ""
        )}
        <Box bg="white" p="5" mb="4" roundedBottom={"xl"} shadow={2}>
          <Tab
            routes={[
              {
                title: t("Worksheets"),
                component: (
                  <VStack>
                    <Worksheets
                      appName={appName}
                      data={worksheets}
                      leftTitle="My Worksheets"
                      rightTitle="Explore All Worksheets"
                      seeButtonText={t("SEE_ALL_WORKSHEETS")}
                      _seeButton={{
                        onPress: (e) => handleExploreAllWorksheets("Publish"),
                      }}
                    />
                    <Worksheets
                      appName={appName}
                      data={worksheetDrafts}
                      leftTitle="Drafts"
                      seeButtonText={t("SEE_ALL_DRAFTS")}
                      _seeButton={{
                        onPress: (e) => handleExploreAllWorksheets("Draft"),
                      }}
                    />
                  </VStack>
                ),
              },
              { title: t("Lesson Plans"), component: <LessonPlans /> },
            ]}
          />
        </Box>
      </VStack>
      <Box bg="white" p="5" position="sticky" bottom="85" shadow={2}>
        <Button
          _text={{ color: "white" }}
          p="3"
          onPress={(e) => navigate("/worksheet/create")}
        >
          {t("CREATE_NEW_WORKSHEET")}
        </Button>
      </Box>
    </Layout>
  );
}

const Worksheets = ({
  data,
  leftTitle,
  rightTitle,
  seeButton,
  seeButtonText,
  _seeButton,
  _woksheetBox,
  appName,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Stack>
      <HStack justifyContent="space-between" py="5" alignItems="center">
        {leftTitle ? <H2>{leftTitle}</H2> : ""}
        {rightTitle ? (
          <Button variant="ghost" onPress={(e) => navigate("/worksheet/list")}>
            <BodyLarge color={colors.primary}>{rightTitle}</BodyLarge>
          </Button>
        ) : (
          ""
        )}
      </HStack>
      {data.length > 0 ? (
        <Stack>
          <VStack space={3}>
            {data.map((item, index) => {
              return (
                <WorksheetBox
                  appName={appName}
                  canShare={true}
                  key={index}
                  {...{ item, url: `/worksheet/${item.id}` }}
                  {..._woksheetBox}
                />
              );
            })}
          </VStack>
          {seeButton ? (
            seeButton
          ) : (
            <Button
              mt="2"
              variant="outline"
              colorScheme="button"
              rounded="lg"
              onPress={(e) => navigate("/worksheet/list")}
              {..._seeButton}
            >
              {seeButtonText}
            </Button>
          )}
        </Stack>
      ) : (
        <Box
          p="10"
          my="5"
          alignItems={"center"}
          rounded="lg"
          bg="viewNotification.600"
        >
          {t("WORKSHEET_NOT_FOUND")}
        </Box>
      )}
    </Stack>
  );
};

const LessonPlans = () => {
  return <h4>LessonPlans</h4>;
};
