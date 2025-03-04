import moment from "moment";
import {
  Actionsheet,
  Box,
  Button,
  HStack,
  Pressable,
  Stack,
  Text,
  VStack,
} from "native-base";
import React, { useState, useEffect, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { TouchableHighlight } from "react-native-web";
import {
  capture,
  IconByName,
  Layout,
  telemetryFactory,
  ProgressBar,
  calendar,
  teacherRegistryService,
  overrideColorTheme,
  H2,
  BodyLarge,
  Subtitle,
  BodySmall,
} from "@shiksha/common-lib";
import { useNavigate } from "react-router-dom";
import colorTheme from "../colorTheme";
const colors = overrideColorTheme(colorTheme);

export default function AttendanceReport({ footerLinks, appName }) {
  const { t } = useTranslation();
  const [weekPage, setWeekPage] = useState(0);
  const [attendanceType, setAttendanceType] = useState("MORNING_SCHOOL");
  const [teacherObject, setTeacherObject] = useState({});
  const teacherId = localStorage.getItem("id");
  const token = localStorage.getItem("token");
  const [attendance, setAttendance] = useState([]);
  const [attendanceObject, setAttendanceObject] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [weekDays, setWeekDays] = useState([]);
  const CalendarBar = React.lazy(() => import("attendance/CalendarBar"));
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    const getData = async () => {
      if (!ignore) {
        setWeekDays(calendar(weekPage, "month"));
      }
    };
    getData();
  }, [weekPage]);

  useEffect(() => {
    let ignore = false;
    const getData = async () => {
      const resultTeacher = await teacherRegistryService.getOne(
        { id: teacherId },
        { Authorization: "Bearer " + token }
      );
      if (!ignore) {
        setTeacherObject(resultTeacher);
        let newMonthDays = calendar(weekPage, "monthInDays");
        setAttendance(
          newMonthDays
            .map((date, index) => {
              if (date.day() !== 0 && moment().add(weekPage, "months") > date) {
                let newType =
                  index % 4 === 0
                    ? "Unmarked"
                    : index % 3 === 0
                    ? "SpecialDuty"
                    : index % 2 === 0
                    ? "Present"
                    : "Absent";
                return {
                  status: "Send",
                  type: newType,
                  date: date.format("Y-MM-DD"),
                  message:
                    date.format("dddd, DD MMMM, Y") +
                    " Time: (10.00am - 2.30pm) was on " +
                    newType +
                    " at Kendriya Vidyalaya Ganeshkhind. Principal Dr. R.C Chandra",
                };
              }
              return null;
            })
            .filter((e) => e)
        );
      }
    };
    getData();
  }, [weekPage, teacherId, token]);

  const handleBackButton = () => {
    const telemetryData = telemetryFactory.end({
      appName,
      type: "Self-Attendance-End-Report",
      startEventId: localStorage.getItem("UUID"),
      duration: 0,
    });
    capture("END", telemetryData);
    navigate(-1);
  };

  return (
    <Layout
      _header={{
        title: t("ATTENDANCE_REPORTS"),
        subHeading: t("MY_PROFILE"),
      }}
      subHeader={
        <HStack space="4" justifyContent="space-between" alignItems="center">
          <Suspense fallback="loading">
            <CalendarBar
              view="monthInDays"
              activeColor="gray.900"
              setPage={setWeekPage}
              page={weekPage}
              _box={{ p: 2, bg: "transparent" }}
            />
          </Suspense>
        </HStack>
      }
      _subHeader={{ bg: colors.cardBg }}
      _appBar={{ onPressBackButton: handleBackButton }}
      _footer={footerLinks}
    >
      <VStack space="1">
        <Box bg={colors.white} p="5" py="30">
          <HStack space="4" justifyContent="space-between" alignItems="center">
            <H2>{t("MY_ATTENDANCE")}</H2>
            <Stack>
              <Button
                rounded={"full"}
                colorScheme="button"
                variant="outline"
                bg="button.100"
                rightIcon={
                  <IconByName
                    color={colors.primary}
                    name="ArrowDownSLineIcon"
                    isDisabled
                  />
                }
                onPress={(e) => setShowModal(true)}
              >
                <BodyLarge color={colors.primary}>
                  {t(attendanceType)}
                </BodyLarge>
              </Button>
              <Actionsheet
                isOpen={showModal}
                _backdrop={{ opacity: "0.9", bg: colors.gray }}
              >
                <Actionsheet.Content
                  p="0"
                  alignItems={"left"}
                  bg={colors.cardBg}
                >
                  <HStack justifyContent={"space-between"}>
                    <Stack p={5} pt={2} pb="25px">
                      <H2>{t("SELECT_VIEW")}</H2>
                    </Stack>
                    <IconByName
                      name="CloseCircleLineIcon"
                      color={colors.cardCloseIcon}
                      onPress={(e) => setShowModal(false)}
                    />
                  </HStack>
                </Actionsheet.Content>
                <Box w="100%" bg={colors.white}>
                  {[
                    { name: t("MORNING_SCHOOL"), value: "MORNING_SCHOOL" },
                    { name: t("EVENING_SCHOOL"), value: "EVENING_SCHOOL" },
                    { name: t("HOLIDAYS"), value: "HOLIDAYS" },
                  ].map((item, index) => {
                    return (
                      <Pressable
                        key={index}
                        p="5"
                        borderBottomWidth={1}
                        borderBottomColor="coolGray.100"
                        onPress={(e) => {
                          setAttendanceType(item.value);
                        }}
                      >
                        <BodyLarge
                          color={
                            attendanceType === item.value ? colors.primary : ""
                          }
                        >
                          {item.name}
                        </BodyLarge>
                      </Pressable>
                    );
                  })}
                  <Box p="5">
                    <Button
                      variant="outline"
                      onPress={(e) => setShowModal(false)}
                    >
                      {t("CONTINUE")}
                    </Button>
                  </Box>
                </Box>
              </Actionsheet>
            </Stack>
          </HStack>
        </Box>
        <Box bg={colors.white}>
          <HStack space="4" justifyContent="space-between" alignItems="center">
            <Box p="5">
              <H2>{t("SEND_MESSAGE")}</H2>
            </Box>
          </HStack>
          <VStack>
            <CalendarComponent
              monthDays={weekDays}
              item={teacherObject}
              attendance={attendance}
              setAttendanceObject={setAttendanceObject}
            />
          </VStack>
          <Actionsheet
            isOpen={attendanceObject?.status}
            _backdrop={{ opacity: "0.9", bg: colors.gray }}
          >
            <Actionsheet.Content
              p="0"
              alignItems={"left"}
              bg={colors.white}
            ></Actionsheet.Content>
            <Box bg="white" w="100%" p="5">
              <VStack space="5" textAlign="center">
                <Subtitle color={colors.gray}>
                  {t("ATTENDANCE_DETAILS")}
                </Subtitle>
                <H2>{attendanceObject?.type}</H2>
                <BodyLarge color={colors.gray}>
                  {attendanceObject.mess2age}
                </BodyLarge>
                <Button
                  variant="outline"
                  flex={1}
                  onPress={(e) => setAttendanceObject({})}
                >
                  {t("CLOSE")}
                </Button>
              </VStack>
            </Box>
          </Actionsheet>
        </Box>
        <VStack space={5} bg={colors.white} p="5">
          <HStack space="4" justifyContent="space-between" alignItems="center">
            <Box py="15px">
              <H2>{t("MY_MONTHLY_ATTENDANCE")}</H2>
            </Box>
          </HStack>
          <Box bg={colors.reportBoxBg} rounded="10px">
            <VStack p="5" space={3}>
              <VStack space={"30px"}>
                {[
                  moment(),
                  moment().add(-1, "months"),
                  moment().add(-2, "months"),
                ].map((month, index) => (
                  <HStack key={index} alignItems={"center"} space={3}>
                    <VStack alignItems={"center"}>
                      <BodySmall>{month.format("Y MMM")}</BodySmall>
                    </VStack>
                    <VStack flex="auto" alignContent={"center"}>
                      <ProgressBar
                        data={[
                          "Present",
                          "Absent",
                          "SpecialDuty",
                          "Unmarked",
                        ].map((status) => {
                          return {
                            name: month.format("Y MMM"),
                            color:
                              status === "Present"
                                ? colors.attendancePresent
                                : status === "Absent"
                                ? colors.attendanceAbsent
                                : status === "Unmarked"
                                ? colors.attendanceUnmarked
                                : "special_duty.500",
                            value: attendance.filter((e) => e.type === status)
                              .length,
                          };
                        })}
                      />
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Box>
          <Button variant={"outline"}>{t("SEE_MORE")}</Button>
        </VStack>
      </VStack>
    </Layout>
  );
}

const CalendarComponent = ({
  monthDays,
  isIconSizeSmall,
  attendance,
  setAttendanceObject,
  type,
  item,
  loding,
  _weekBox,
}) => {
  return monthDays.map((week, index) => (
    <HStack
      key={index}
      justifyContent="space-around"
      alignItems="center"
      borderBottomWidth={
        monthDays.length > 1 && monthDays.length - 1 !== index ? "1" : "0"
      }
      borderBottomColor={"coolGray.300"}
      p={"2"}
      {...(_weekBox?.[index] ? _weekBox[index] : {})}
    >
      {week.map((day, subIndex) => {
        let isToday = moment().format("Y-MM-DD") === day.format("Y-MM-DD");
        let dateValue = day.format("Y-MM-DD");
        let smsItem = attendance
          .slice()
          .reverse()
          .find((e) => e.date === dateValue);
        let smsIconProp = !isIconSizeSmall
          ? {
              _box: { py: 2, minW: "46px", alignItems: "center" },
              status: "CheckboxBlankCircleLineIcon",
            }
          : {};
        if (smsItem?.type && smsItem?.type === "Present") {
          smsIconProp = {
            ...smsIconProp,
            status: smsItem?.type,
            type: smsItem?.status,
          };
        } else if (smsItem?.type && smsItem?.type === "Absent") {
          smsIconProp = {
            ...smsIconProp,
            status: smsItem?.type,
            type: smsItem?.status,
          };
        } else if (smsItem?.type && smsItem?.type === "SpecialDuty") {
          smsIconProp = {
            ...smsIconProp,
            status: smsItem?.type,
            type: smsItem?.status,
          };
        } else if (day.day() === 0) {
          smsIconProp = { ...smsIconProp, status: "Holiday" };
        } else if (isToday) {
          smsIconProp = { ...smsIconProp, status: "Today" };
        } else if (moment().diff(day, "days") > 0) {
          smsIconProp = { ...smsIconProp, status: "Unmarked" };
        }

        return (
          <VStack
            key={subIndex}
            alignItems="center"
            opacity={
              type && type !== "month" && day.day() !== 0
                ? 1
                : day.day() === 0
                ? 0.3
                : day.format("M") !== moment().format("M")
                ? 0.3
                : 1
            }
          >
            <Text
              key={subIndex}
              pt={monthDays.length > 1 && index ? 0 : !isIconSizeSmall ? 2 : 0}
              textAlign="center"
            >
              {!isIconSizeSmall ? (
                <VStack alignItems={"center"}>
                  {index === 0 ? (
                    <Text pb="1" color={colors.dateLight}>
                      {day.format("ddd")}
                    </Text>
                  ) : (
                    ""
                  )}
                  <Text color={colors.date}>{day.format("DD")}</Text>
                </VStack>
              ) : (
                <HStack alignItems={"center"} space={1}>
                  <Text>{day.format("dd")}</Text>
                  <Text>{day.format("D")}</Text>
                </HStack>
              )}
            </Text>
            <TouchableHighlight
              onPress={(e) => setAttendanceObject(smsItem)}
              // onLongPress={(e) => {
              //   console.log({ e });
              // }}
            >
              <Box alignItems="center">
                {loding && loding[dateValue + item.id] ? (
                  <GetIcon
                    {...smsIconProp}
                    status="Loader4LineIcon"
                    color={colors.primary}
                    isDisabled
                    _icon={{ _fontawesome: { spin: true } }}
                  />
                ) : (
                  <GetIcon {...smsIconProp} />
                )}
              </Box>
            </TouchableHighlight>
          </VStack>
        );
      })}
    </HStack>
  ));
};

export const GetIcon = ({ status, _box, color, _icon }) => {
  let icon = <></>;
  let iconProps = { fontSize: "xl", isDisabled: true, ..._icon };
  switch (status) {
    case "Present":
      icon = (
        <Box {..._box} color={color ? color : colors.attendancePresent}>
          <IconByName name="CheckboxCircleLineIcon" {...iconProps} />
        </Box>
      );
      break;
    case "Absent":
      icon = (
        <Box {..._box} color={color ? color : colors.attendanceAbsent}>
          <IconByName name="CloseCircleLineIcon" {...iconProps} />
        </Box>
      );
      break;
    case "SpecialDuty":
      icon = (
        <Box {..._box} color={color ? color : colors.specialDuty}>
          <IconByName name="AwardLineIcon" {...iconProps} />
        </Box>
      );
      break;
    case "Holiday":
      icon = (
        <Box {..._box} color={color ? color : colors.holiDay}>
          <IconByName name="CheckboxBlankCircleLineIcon" {...iconProps} />
        </Box>
      );
      break;
    case "Unmarked":
      icon = (
        <Box {..._box} color={color ? color : colors.attendanceUnmarked}>
          <IconByName name="CheckboxBlankCircleLineIcon" {...iconProps} />
        </Box>
      );
      break;
    case "Today":
      icon = (
        <Box {..._box} color={color ? color : colors.attendanceUnmarked}>
          <IconByName name="CheckboxBlankCircleLineIcon" {...iconProps} />
        </Box>
      );
      break;
    default:
      icon = (
        <Box {..._box} color={color ? color : colors.attendancedefault}>
          <IconByName name={status} {...iconProps} />
        </Box>
      );
      break;
  }
  return icon;
};
